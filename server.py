#!/usr/bin/env python3
"""
Local Server & Automation Handler for Vision AI Nota Tembakau.
Serves the web dashboard and provides direct integration with local Excel files in E:\gudang.
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 5000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

def main():
    print("=" * 60)
    print(" 🚀 Vision AI — Dashboard Generator Nota & Buku Sortir")
    print("=" * 60)
    print(f" Web Server berjalan di: http://localhost:{PORT}")
    print(f" Folder Direktori: {DIRECTORY}")
    print(" Tekan Ctrl + C untuk menghentikan server.")
    print("=" * 60)

    try:
        webbrowser.open(f"http://localhost:{PORT}")
    except Exception:
        pass

    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer dihentikan.")

if __name__ == "__main__":
    main()
