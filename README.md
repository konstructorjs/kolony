<p align="center"><a href="https://konstructor.js.org" target="_blank"><img width="100"src="https://konstructor.js.org/assets/static/images/konstructor.png"></a></p>
<p align="center">
  <a href="https://travis-ci.org/konstructorjs/kolony"><img src="https://img.shields.io/travis/konstructorjs/kolony.svg" alt="Build Status"></a>
  <a href="https://www.npmjs.com/package/kolony"><img src="https://img.shields.io/npm/dm/kolony.svg" alt="Downloads"></a>
  <a href="https://www.npmjs.com/package/kolony"><img src="https://img.shields.io/npm/v/kolony.svg" alt="Version"></a>
  <a href="https://www.npmjs.com/package/kolony"><img src="https://img.shields.io/npm/l/kolony.svg" alt="License"></a>
</p>

# kolony - a self hosted deployment tool
kolony is similar to tools like [Dokku](https://github.com/dokku/dokku) or [Flynn](https://flynn.io/), but it is based off of pm2 instead of docker which means it can run on cheap OpenVZ servers like [VPSDime](https://vpsdime.com/aff.php?aff=1576) (affiliate link), as well as more expensive KVM servers like [DigitalOcean](https://m.do.co/c/4bfd9876d75a) (affiliate link)

## Getting Started

### Requirements
- [git](https://git-scm.com/)
- [nginx](https://www.nginx.com/resources/wiki/)
- [nvm](https://github.com/creationix/nvm)
- [pm2](http://pm2.keymetrics.io/)

### Installation
The easiest way to install konoly is through npm.
```
npm install -g kolony
```

Once it's installed, run the setup to verify everything is working.
```
kolony setup
```

## Documentation/Guides
You can find all of the documentation on [konstructor's website](https://konstructor.js.org/guides/kolony).
