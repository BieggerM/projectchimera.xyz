# Terminal Container
FROM alpine:latest

RUN adduser -D -s /bin/bash terminal_user

RUN apk add --no-cache bash

WORKDIR /home/terminal_user

USER terminal_user

CMD ["/bin/bash"]