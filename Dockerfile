# Dockerfile

FROM alpine:latest

COPY container_files/motd /etc/motd
COPY container_files/profile /etc/profile

RUN apk add --no-cache bash shadow

# Copy entrypoint script into the container
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Copy User Home dirs to overwrite tmpfs later
COPY ./container_home/terminal_user /app-data/terminal_user_files/
COPY ./container_home/terminal_user2 /app-data/terminal_user2_files/

# Users
RUN adduser -D -s /bin/bash terminal_user
RUN adduser -D -s /bin/bash terminal_user2 

# Chpasswd  
RUN echo "terminal_user2:test" | chpasswd
RUN passwd -l root


ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]


CMD ["/bin/bash"]