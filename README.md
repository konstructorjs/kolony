# kolony
a self hosted deployment tool for [konstructor](https://github.com/konstructorjs/konstructor) similar to [Dokku](https://github.com/dokku/dokku) or [Heroku](https://www.heroku.com/). unlike Dokku, kolony does not use docker which means it can run on cheap OpenVZ servers like [VPSDime](https://vpsdime.com/aff.php?aff=1576)

## Installation
kolony has the following prerequisites
- [git](https://git-scm.com/)
- [nginx](https://www.nginx.com/resources/wiki/)
- [nvm](https://github.com/creationix/nvm)
- [pm2](http://pm2.keymetrics.io/)

once you have installed the prerequisites, install kolony
```
npm install -g kolony
```

finally, set up kolony
```
kolony setup
```
