FROM alpine:latest

RUN apk add --no-cache bash

RUN echo -e "\n\e[34m" > /etc/motd && \
    echo -e "██████╗░██╗███████╗░██████╗░░██████╗░███████╗██████╗░███╗░░░███╗\e[0m" >> /etc/motd && \
    echo -e "██╔══██╗██║██╔════╝██╔════╝░██╔════╝░██╔════╝██╔══██╗████╗░████║\e[0m" >> /etc/motd && \
    echo -e "██████╦╝██║█████╗░░██║░░██╗░██║░░██╗░█████╗░░██████╔╝██╔████╔██║\e[0m" >> /etc/motd && \
    echo -e "██╔══██╗██║██╔══╝░░██║░░╚██╗██║░░╚██╗██╔══╝░░██╔══██╗██║╚██╔╝██║\e[0m" >> /etc/motd && \
    echo -e "██████╦╝██║███████╗╚██████╔╝╚██████╔╝███████╗██║░░██║██║░╚═╝░██║\e[0m" >> /etc/motd && \
    echo -e "╚═════╝░╚═╝╚══════╝░╚═════╝░░╚═════╝░╚══════╝╚═╝░░╚═╝╚═╝░░░░░╚═╝\e[0m" >> /etc/motd && \
    echo -e "\n\e[32m" >> /etc/motd && \
    echo -e "██╗░██████╗░█████╗░██████╗░░█████╗░██████╗░\e[0m" >> /etc/motd && \
    echo -e "██║██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔══██╗\e[0m" >> /etc/motd && \
    echo -e "██║╚█████╗░██║░░██║██████╔╝██║░░██║██║░░██║\e[0m" >> /etc/motd && \
    echo -e "██║░╚═══██╗██║░░██║██╔═══╝░██║░░██║██║░░██║\e[0m" >> /etc/motd && \
    echo -e "██║███████║╚█████╔╝██║░░░░░╚█████╔╝██████╔╝\e[0m" >> /etc/motd && \
    echo -e "╚═╝╚═════╝░░╚════╝░╚═╝░░░░░░╚════╝░╚═════╝░\e[0m" >> /etc/motd && \
    echo -e "\n\e[36mThis is the result of a practice project in secure, ephemeral environments.\e[0m" >> /etc/motd && \
    echo -e "\e[33mFeel free to probe the boundaries of this sandbox.\e[0m" >> /etc/motd && \
    echo -e "\e[33mAll activity is contained and this instance will be destroyed on exit.\n\e[0m" >> /etc/motd

RUN echo 'cat /etc/motd' >> /etc/profile

RUN adduser -D -s /bin/bash terminal_user

WORKDIR /home/terminal_user

USER terminal_user

CMD ["/bin/bash", "--login"]