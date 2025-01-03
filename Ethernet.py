import socket
import struct
import textwrap

def main():
    conn = socket.socket(socket.AF_PACKET, socket.SOCK_RAW, socket.htons(3))
    while True:
        raw_data, addr = conn.recvfrom(65536)
        dest_mac, src_mac, eth_proto, data = ethernet_frame(raw_data)
        print('\nEthernet frame:')
        print('Destination: {}, Source: {}, Protocol: {}'.format(dest_mac, src_mac, eth_proto))

# Unpack Ethernet frame
def ethernet_frame(data):
    dest_mac, src_mac, eth_proto = struct.unpack('!6s6sH', data[:14])  # Unpack Ethernet header
    return get_mac_addr(dest_mac), get_mac_addr(src_mac), eth_protocol(eth_proto), data[14:]  # Payload is data[14:]

# Convert MAC address to string format
def get_mac_addr(bytes_addr):
    bytes_str = map('{:02x}'.format, bytes_addr)
    return ':'.join(bytes_str).upper()

# Convert protocol number to human-readable format
def eth_protocol(proto):
    eth_protocols = {
        0x0800: 'IPv4',
        0x0806: 'ARP',
        0x86DD: 'IPv6',
    }
    return eth_protocols.get(proto, 'Unknown')

if __name__ == '__main__':
    main()
