const {spawn} = require('child_process');

const pythonP = spawn('python3', ['xls2csv.py', './Planning/planningXls/3ETI.xls']);

pythonP.stdout.on('data', (data) => {
    console.log('node: (python stdout) ' + data.toString());
    }
);
pythonP.on('close', (code) => {
    console.log(`node: child process exited with code ${code}`);
    }
);

