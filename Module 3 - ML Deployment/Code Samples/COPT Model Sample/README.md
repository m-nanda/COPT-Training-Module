# Boiler Combustion Optimizer API SOKET 2
This is the deployment branch that we use on deployment server. The code are packed into docker with command `docker build -t <dockerimage> .` on this directory. And then the docker image are push to the server and run it using `docker run -itd --name <dockername> --restart unless-stopped --memory="5G" -p 0.0.0.0:5002:5002 <dockerimage>`.

We use `--restart unless-stopped` to avoid midtime crash and stopped working, so it will automatically started again. And we limit the memory usage to 5 Gigabytes. If it exceed, it will restarted to avoid eating up memory.