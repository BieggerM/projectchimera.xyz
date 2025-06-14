FROM alpine:latest

RUN apk add --no-cache bash


COPY container_files/motd /etc/motd
COPY container_files/profile /etc/profile
COPY container_files/usr/local/bin/github /usr/local/bin/github

RUN chmod +x /usr/local/bin/github

RUN adduser -D -s /bin/bash terminal_user

WORKDIR /home/terminal_user

USER terminal_user

CMD ["/bin/bash", "--login"]