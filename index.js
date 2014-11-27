var archiver = require('archiver')
var fs = require('fs')
var output = fs.createWriteStream("test.zip")

var archive = archiver('zip')
archive.bulk([
  { src: ['./**'],  cwd: './tmp/JesCFH7BiQf0tzXn/', expand: true}
]);

archive.pipe(output)

archive.on('error', function(err) {
	console.log("error : "+err)
})

/*fs.readdirSync('./tmp/JesCFH7BiQf0tzXn').forEach(function(file) {
	console.log(file)
	archive.file(file)
})*/

archive.finalize()