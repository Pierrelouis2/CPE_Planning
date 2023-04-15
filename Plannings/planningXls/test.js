const {spawn} = require('child_process');

const pythonP = spawn('python3', ['test.py']);

pythonP.stdout.on('data', (data) => {
    console.log('node: (python stdout) ' + data.toString());
    }
);
pythonP.on('close', (code) => {
    console.log(`node: child process exited with code ${code}`);
    }
);

