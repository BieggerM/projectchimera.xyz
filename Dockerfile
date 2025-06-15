# Dockerfile

FROM alpine:latest

RUN apk add --no-cache bash shadow

RUN chmod u+s /bin/su

COPY container_files/motd /etc/motd
COPY container_files/profile /etc/profile


RUN adduser -D -s /bin/bash terminal_user
RUN chown -R terminal_user:terminal_user /home/terminal_user
# --- CORRECTED USER AND FILE CREATION ---
RUN passwd -l root
RUN adduser -D -s /bin/bash privileged_user
RUN echo "privileged_user:dein-sicheres-passwort" | chpasswd


# Erstelle die Datei, NACHDEM der Benutzer existiert und die Rechte korrekt sind.
RUN touch /home/terminal_user/special.txt
RUN chown terminal_user:terminal_user /home/terminal_user/special.txt
# --- END CORRECTION ---

USER terminal_user
WORKDIR /home/terminal_user

CMD ["/bin/bash", "--login"]