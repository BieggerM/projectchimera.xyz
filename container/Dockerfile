# Dockerfile

FROM alpine:latest

# Style and flair
COPY container_files/motd /etc/motd
COPY container_files/bashrc /usr/local/share/isopod/.bashrc_template
# Buffers 
#   less
RUN mv /usr/bin/less /usr/bin/less.bin
COPY container_files/less /usr/bin/less
RUN chmod +x /usr/bin/less
#   vi
RUN mv /usr/bin/vi /usr/bin/vi.bin
COPY container_files/vi /usr/bin/vi
RUN chmod +x /usr/bin/vi
#   tail

# Install apk
RUN apk add --no-cache bash shadow
RUN chmod u+s /bin/su
# Copy entrypoint script into the container
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Copy User Home dirs to overwrite tmpfs later
COPY ./container_home/investigator /app-data/investigator/
COPY ./container_home/evans /app-data/evans/
COPY ./container_home/sys_admin /app-data/sys_admin/
COPY ./container_home/subject07 /app-data/subject07/

# Users
RUN adduser -D -s /bin/bash investigator
RUN adduser -D -s /bin/bash evans
RUN adduser -D -s /bin/bash sys_admin
RUN adduser -D -s /bin/bash subject07


# Chpasswd  
RUN echo "evans:Orion1977" | chpasswd
RUN echo "sys_admin:MontBlanc" | chpasswd
RUN echo "subject07:null_geburt" | chpasswd
RUN passwd -l root


ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]


CMD ["/bin/bash", "--login"]