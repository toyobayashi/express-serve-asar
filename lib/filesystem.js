const path = require('path')
const UINT64 = require('cuint').UINT64

class Filesystem {
  constructor (src) {
    this.src = path.resolve(src)
    this.header = { files: {} }
    this.offset = UINT64(0)
  }

  searchNodeFromDirectory (p) {
    let json = this.header
    const dirs = p.split(path.sep)
    for (const dir of dirs) {
      if (dir !== '.') {
        json = json.files[dir]
      }
    }
    return json
  }

  getNode (p) {
    const node = this.searchNodeFromDirectory(path.dirname(p))
    const name = path.basename(p)
    if (name) {
      return node.files[name]
    } else {
      return node
    }
  }

  getFile (p, followLinks) {
    followLinks = typeof followLinks === 'undefined' ? true : followLinks
    const info = this.getNode(p)

    if (info.link && followLinks) {
      return this.getFile(info.link)
    } else {
      return info
    }
  }
}

module.exports = Filesystem
