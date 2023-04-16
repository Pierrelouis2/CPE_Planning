const fileInput = document.getElementById('file');
const fileLabel = document.getElementById('file-label');

fileInput.addEventListener('change', (event) => {
  const fileName = event.target.value.split('\\').pop(); // get the file name
  if (fileName){
    fileLabel.textContent = fileName; 
    fileLabel.style.color="#bd1050";
    fileLabel.style.borderBottom="2px solid #bd1050";
  } else{
    fileLabel.textContent = 'Choissisez un fichier'; // reset the label text
  }
});
