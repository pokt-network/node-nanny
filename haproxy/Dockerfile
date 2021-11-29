FROM ubuntu:latest
LABEL Name=haproxy Version=0.0.1
RUN useradd -ms /bin/bash haproxy
ARG DEBIAN_FRONTEND=noninteractive
ENV HAPROXY_UID=haproxy
ENV HAPROXY_GID=haproxy
RUN apt-get -y update && apt-get install -y git ca-certificates gcc libc6-dev liblua5.3-dev libpcre3-dev libssl-dev libsystemd-dev make wget zlib1g-dev
RUN git clone https://github.com/haproxy/haproxy.git && cd haproxy && git checkout v2.5.0
RUN cd haproxy && make TARGET=linux-glibc USE_LUA=1 USE_OPENSSL=1 USE_PCRE=1 USE_ZLIB=1 USE_SYSTEMD=1 USE_PROMEX=1 && make install-bin
CMD ["/usr/local/sbin/haproxy", "-f", "/usr/local/etc/haproxy/haproxy.cfg"]
