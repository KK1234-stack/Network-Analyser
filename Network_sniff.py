import socket
import struct
import textwrap

# Tab constants for formatting output
Tab1 = '\t - '
Tab2 = '\t\t - '
Tab3 = '\t\t\t - '
Tab4 = '\t\t\t\t - '

DataTab1 = '\t '
DataTab2 = '\t\t '
DataTab3 = '\t\t\t '
DataTab4 = '\t\t\t\t '

def main():
    # Prompt user to select the network interface
    interface = input("Enter the network interface (e.g., eth0, wlan0): ").strip()

    try:
        # Open raw socket for the selected interface
        conn = socket.socket(socket.AF_PACKET, socket.SOCK_RAW, socket.ntohs(3))
        conn.bind((interface, 0))
        print(f"Listening on {interface}... Press Ctrl+C to stop.")

        while True:
            raw_data, addr = conn.recvfrom(65536)
            dest_mac, src_mac, eth_proto, data = ethernet_frame(raw_data)
            print('\nEthernet frame:')
            print(Tab1 + 'Destination: {}, Source: {}, Protocol: {}'.format(dest_mac, src_mac, eth_proto))

            # Check if the protocol is IPv4 (0x0800)
            if eth_proto == 'IPv4':
                version, header_len, ttl, proto, src, target, data = ipv4_packet(data)
                print(Tab1 + 'IPv4 Packet:')
                print(Tab2 + 'Version: {}, Header Length: {}, TTL: {}'.format(version, header_len, ttl))
                print(Tab2 + 'Protocol: {}, Source: {}, Target: {}'.format(proto, src, target))

                # Handle ICMP
                if proto == 1:  # ICMP
                    icmp_type, code, checksum = icmp_packet(data)
                    print(Tab2 + 'ICMP Packet:')
                    print(Tab3 + 'Type: {}, Code: {}, Checksum: {}'.format(icmp_type, code, checksum))

                # Handle TCP
                elif proto == 6:  # TCP
                    src_port, dest_port, sequence, acknowledgment, offset, flag_urg, flag_ack, flag_psh, flag_rst, flag_syn, flag_fin, data = tcp_seg(data)
                    print(Tab2 + 'TCP Segment:')
                    print(Tab3 + 'Source Port: {}, Destination Port: {}'.format(src_port, dest_port))
                    print(Tab3 + 'Sequence Number: {}, Acknowledgment: {}'.format(sequence, acknowledgment))
                    print(Tab3 + 'Offset: {}, URG: {}, ACK: {}, PSH: {}, RST: {}, SYN: {}, FIN: {}'.format(offset, flag_urg, flag_ack, flag_psh, flag_rst, flag_syn, flag_fin))
                    print(Tab3 + 'Data: ')
                    print(format_multi_line(DataTab4, data))

                # Handle UDP
                elif proto == 17:  # UDP
                    src_port, dest_port, size, data = udp_seg(data)
                    print(Tab2 + 'UDP Segment:')
                    print(Tab3 + 'Source Port: {}, Destination Port: {}, Size: {}'.format(src_port, dest_port, size))
                    print(Tab3 + 'Data: ')
                    print(format_multi_line(DataTab4, data))

                else:
                    print(Tab2 + 'Unknown Protocol Data:')
                    print(format_multi_line(DataTab3, data))

            # If the Ethernet protocol is not IPv4
            else:
                print(Tab1 + 'Data: ')
                print(format_multi_line(DataTab1, data))
    
    except KeyboardInterrupt:
        print("\nTerminating program...")
        conn.close()  # Close the socket
    except Exception as e:
        print(f"Error: {e}")

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

# Unpack IPv4 packet header
def ipv4_packet(data):
    version_header_len = data[0]
    version = version_header_len >> 4
    header_len = (version_header_len & 15) * 4

    ttl, proto, src, target = struct.unpack('! 8x B B 2x 4s 4s', data[:20])
    return version, header_len, ttl, proto, ipv4(src), ipv4(target), data[header_len:]

def ipv4(addr):
    return '.'.join(map(str, addr))

# Unpack ICMP packet
def icmp_packet(data):
    icmp_type, code, checksum = struct.unpack('! B B H', data[:4])
    return icmp_type, code, checksum

# Unpack TCP segment
def tcp_seg(data):
    src_port, dest_port, sequence, acknowledgment, offset_reserved_flags = struct.unpack('! H H L L H', data[:14])
    offset = (offset_reserved_flags >> 12) * 4
    flag_urg = (offset_reserved_flags & 32) >> 5
    flag_ack = (offset_reserved_flags & 16) >> 4
    flag_psh = (offset_reserved_flags & 8) >> 3
    flag_rst = (offset_reserved_flags & 4) >> 2
    flag_syn = (offset_reserved_flags & 2) >> 1
    flag_fin = (offset_reserved_flags & 1)

    return src_port, dest_port, sequence, acknowledgment, offset, flag_urg, flag_ack, flag_psh, flag_rst, flag_syn, flag_fin, data[offset:]

# Unpack UDP segment
def udp_seg(data):
    src_port, dest_port, size = struct.unpack('! H H 2x H', data[:8])
    return src_port, dest_port, size, data[8:]

# Format multi-line data
def format_multi_line(prefix, string, size=80):
    size -= len(prefix)
    if isinstance(string, bytes):
        string = ''.join(r'\x{:02x}'.format(byte) for byte in string)
        if size % 2:
            size -= 1
    return '\n'.join([prefix + line for line in textwrap.wrap(string, size)])

if __name__ == '__main__':
    main()
