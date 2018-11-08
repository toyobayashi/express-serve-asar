const fs = process.versions.electron ? require('original-fs') : require('fs')
const pickle = require('chromium-pickle-js')
const mime = require('mime')
const path = require('path')
const Filesystem = require('./lib/filesystem.js')

const fdCache = {}

function readArchiveHeaderSync (fd) {
  // const fd = fs.openSync(archive, 'r')
  let size
  let headerBuf
  // try {
  const sizeBuf = Buffer.alloc(8)
  if (fs.readSync(fd, sizeBuf, 0, 8, null) !== 8) {
    throw new Error('Unable to read header size')
  }

  const sizePickle = pickle.createFromBuffer(sizeBuf)
  size = sizePickle.createIterator().readUInt32()
  headerBuf = Buffer.alloc(size)
  if (fs.readSync(fd, headerBuf, 0, size, null) !== size) {
    throw new Error('Unable to read header')
  }
  // } finally {
  //   fs.closeSync(fd)
  // }

  const headerPickle = pickle.createFromBuffer(headerBuf)
  const header = headerPickle.createIterator().readString()
  return { header: JSON.parse(header), headerSize: size }
}

function readFilesystemSync (archive) {
  if (!fdCache[archive]) {
    const fd = fs.openSync(archive, 'r')
    const header = readArchiveHeaderSync(fd)
    const filesystem = new Filesystem(archive)
    filesystem.header = header.header
    filesystem.headerSize = header.headerSize
    fdCache[archive] = {
      fd,
      filesystem: filesystem
    }
  }

  return fdCache[archive]
}

function serveAsar (contentBase, header) {
  return function (req, res, next) {
    if (!req.path.includes('.asar/')) return next()

    const fullPath = path.join(contentBase || process.cwd(), decodeURIComponent(req.path))
    const archive = fullPath.substr(0, fullPath.indexOf('.asar' + path.sep) + 5)
    const asarFile = fullPath.substr(fullPath.indexOf('.asar' + path.sep) + 6)
    try {
      const file = readFilesystemSync(archive)
      const { filesystem, fd } = file
      const info = filesystem.getFile(asarFile)
      if (info) {
        const defaultHeader = {
          'Content-Type': mime.getType(asarFile),
          'Content-Length': info.size
        }
        res.set(header ? Object.assign({}, defaultHeader, header) : defaultHeader)

        fs.createReadStream('', {
          fd,
          autoClose: false,
          start: 8 + filesystem.headerSize + parseInt(info.offset, 10),
          end: 8 + filesystem.headerSize + parseInt(info.offset, 10) + info.size - 1
        }).on('error', (err) => {
          console.error(err)
          res.status(404).send('404 Not Found.')
        }).pipe(res.status(200))
      } else {
        res.status(404).send('404 Not Found.')
      }
    } catch (err) {
      console.error(err)
      res.status(404).send('404 Not Found.')
    }
  }
}

module.exports = serveAsar
