package main

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"time"
)

type InboundMessage struct {
	Command   string          `json:"command"`
	Config    json.RawMessage `json:"config,omitempty"`
	ID        string          `json:"id,omitempty"`
	Host      string          `json:"host,omitempty"`
	Port      int             `json:"port,omitempty"`
	TimeoutMs int             `json:"timeoutMs,omitempty"`
}

type OutboundMessage struct {
	Status    string `json:"status,omitempty"`
	Type      string `json:"type,omitempty"`
	ID        string `json:"id,omitempty"`
	LatencyMs int64  `json:"latencyMs,omitempty"`
	Error     string `json:"error,omitempty"`
	Host      string `json:"host,omitempty"`
	Port      int    `json:"port,omitempty"`
}

var xrayCmd *exec.Cmd

func sendMessage(msg OutboundMessage) error {
	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}
	length := uint32(len(data))
	if err := binary.Write(os.Stdout, binary.LittleEndian, length); err != nil {
		return err
	}
	_, err = os.Stdout.Write(data)
	return err
}

func handlePing(msg InboundMessage) {
	timeout := 3 * time.Second
	if msg.TimeoutMs > 0 {
		timeout = time.Duration(msg.TimeoutMs) * time.Millisecond
	}

	address := fmt.Sprintf("%s:%d", msg.Host, msg.Port)
	start := time.Now()

	conn, err := net.DialTimeout("tcp", address, timeout)
	if err != nil {
		sendMessage(OutboundMessage{
			Type:  "PING_ERROR",
			ID:    msg.ID,
			Error: err.Error(),
			Host:  msg.Host,
			Port:  msg.Port,
		})
		return
	}
	defer conn.Close()

	latency := time.Since(start).Milliseconds()
	sendMessage(OutboundMessage{
		Type:      "PING_RESULT",
		ID:        msg.ID,
		LatencyMs: latency,
		Host:      msg.Host,
		Port:      msg.Port,
	})
}

func main() {
	var length uint32
	for {
		err := binary.Read(os.Stdin, binary.LittleEndian, &length)
		if err != nil {
			if err == io.EOF {
				break
			}
			return
		}

		buf := make([]byte, length)
		_, err = io.ReadFull(os.Stdin, buf)
		if err != nil {
			return
		}

		var msg InboundMessage
		if err := json.Unmarshal(buf, &msg); err != nil {
			continue
		}

		switch msg.Command {
		case "START":
			if xrayCmd != nil && xrayCmd.Process != nil {
				_ = xrayCmd.Process.Kill()
			}

			exeDir, _ := filepath.Abs(filepath.Dir(os.Args[0]))
			configPath := filepath.Join(exeDir, "config.json")
			_ = os.WriteFile(configPath, msg.Config, 0644)

			xrayPath := filepath.Join(exeDir, "xray.exe")
			xrayCmd = exec.Command(xrayPath, "run", "-c", configPath)
			if err := xrayCmd.Start(); err != nil {
				sendMessage(OutboundMessage{Status: "error", Error: err.Error()})
			} else {
				sendMessage(OutboundMessage{Status: "started"})
			}

		case "STOP":
			if xrayCmd != nil && xrayCmd.Process != nil {
				_ = xrayCmd.Process.Kill()
			}
			sendMessage(OutboundMessage{Status: "stopped"})
			time.Sleep(200 * time.Millisecond)
			os.Exit(0)

		case "PING":
			go handlePing(msg)
		}
	}
}
