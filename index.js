const canvas = document.querySelector('#canvas')
const ctx = canvas.getContext('2d')

const clearBtn = document.querySelector('#clear')

clearBtn.addEventListener(('click'), () => {
    ctx.clearRect(0,0,canvas.width,canvas.height)
})

document.querySelector('[data-coloris]').addEventListener('change', (e) => {
    const brushColor = e.target.value;
    ctx.strokeStyle = brushColor;
})

// Tool Selection Event
let selectedTool = 'Pencil'
const setTool = (tool) => {
  selectedTool = tool;
  if (tool === 'Pencil') {
    canvas.style.cursor = 'url("icon/brush.png") 16 28, auto'
  } else if (tool === 'Cut') {
    canvas.style.cursor = 'url("icon/scissor.png") 16 16, auto'
  } else if (tool === 'Eraser') {
    canvas.style.cursor = 'url("icon/eraser.png") 18 32, auto'
  } else {
    canvas.style.cursor = 'crosshair'
  }
}


// ------VAR-------------
let startX
let startY
let copiedImage
let savedImage
let width
let height
let isDrawing = false
let isTyping = false
const font = ['Courier new','monospace','fantasy']
let choosenFont
let brushSize = 5
let history = []
let redoStack = []
// ----------------------

// For convention: stroke style
// -----------------------
ctx.strokeStyle = '#a0c4ff'
ctx.lineWidth = brushSize
// ------------------------

const startDrawing = (e) => {
    console.log('start-drawing')
    saveState()
    if (selectedTool == 'Line' || selectedTool=='Circle'||selectedTool=='Rectangle'||selectedTool=='Copy'||selectedTool=='Cut'|| selectedTool=='Triangle') {
        startX = e.offsetX
        startY = e.offsetY
        savedImage = ctx.getImageData(0,0,canvas.width,canvas.height)
    } else if (selectedTool == 'Pencil' || selectedTool == 'Eraser'||selectedTool=='Paste') {
        ctx.beginPath()
        ctx.moveTo(e.offsetX,e.offsetY)
    } 
    isDrawing = true

}

const drawing = (e) => {
    if (!isDrawing) return
    if (selectedTool==='Pencil') {
        ctx.lineTo(e.offsetX,e.offsetY)
        console.log('drawing')
        ctx.stroke()
    } else if (selectedTool ==='Cut') {
        ctx.putImageData(savedImage,0,0)
        ctx.beginPath()
        ctx.setLineDash([10,8])
        ctx.rect(startX,startY,e.offsetX-startX,e.offsetY-startY)
        ctx.stroke()
        ctx.setLineDash([])
    } else if (selectedTool==='Eraser') {
        ctx.globalCompositeOperation = 'destination-out'
        ctx.lineTo(e.offsetX,e.offsetY)
        ctx.stroke()
        ctx.globalCompositeOperation = 'source-over'
    } else if (selectedTool=='Copy') {
        ctx.putImageData(savedImage,0,0)
        ctx.beginPath()
        ctx.setLineDash([10,8])
        ctx.rect(startX,startY,e.offsetX-startX,e.offsetY-startY)
        ctx.stroke()
        ctx.setLineDash([])
    } else if (selectedTool==='Line') {
        ctx.putImageData(savedImage,0,0)
        ctx.beginPath()
        ctx.moveTo(startX,startY)
        ctx.lineTo(e.offsetX,e.offsetY)
        ctx.stroke()
    } else if (selectedTool==='Paste') {

    } else if (selectedTool==='Circle') {
        ctx.putImageData(savedImage,0,0)
        ctx.beginPath()
        ctx.arc(startX, startY, e.offsetX-startX, 0, 2 * Math.PI);
        ctx.stroke()
    } else if (selectedTool==='Rectangle') {
        ctx.putImageData(savedImage,0,0)
        ctx.beginPath()
        ctx.rect(startX,startY,e.offsetX-startX,e.offsetY-startY)
        ctx.stroke()
    } else if (selectedTool === 'Triangle')  {
        ctx.putImageData(savedImage, 0, 0);
        ctx.beginPath();
        // 當前鼠標位置作為第二個頂點
        let endX = e.offsetX;
        let endY = e.offsetY;
        // 計算中點
        let midX = (startX + endX) / 2;
        let midY = (startY + endY) / 2;
        // 計算基線向量與長度
        let dx = endX - startX;
        let dy = endY - startY;
        let baseLength = Math.sqrt(dx * dx + dy * dy);
        if (baseLength === 0) baseLength = 1; // 避免除以 0
        // 計算垂直方向的偏移（這裡用基線長度的一半作爲偏移量）
        let offsetX = -dy / 2;
        let offsetY = dx / 2;
        // 得到第三個頂點
        let thirdX = midX + offsetX;
        let thirdY = midY + offsetY;
        
        // 畫出三角形
        ctx.moveTo(startX, startY);   // 第一頂點
        ctx.lineTo(endX, endY);         // 第二頂點
        ctx.lineTo(thirdX, thirdY);     // 第三頂點
        ctx.closePath();                // 自動連接回第一頂點
        ctx.stroke();
    } 
}


const stopDrawing = (e) => {
    if (selectedTool==='Paste') {
        if (copiedImage) 
            ctx.putImageData(copiedImage,e.offsetX-width/2,e.offsetY-height/2)
    }
    if (!isDrawing) return
    if (selectedTool === 'Copy') {
        let endX = e.offsetX;
        let endY = e.offsetY;
        let x = Math.min(startX, endX);
        let y = Math.min(startY, endY);
        width = Math.abs(endX - startX);
        height = Math.abs(endY - startY);
        ctx.putImageData(savedImage,0,0)
        copiedImage = ctx.getImageData(x, y, width, height);
  
    } else if (selectedTool === 'Cut') {
        let endX = e.offsetX;
        let endY = e.offsetY;
        let x = Math.min(startX, endX);
        let y = Math.min(startY, endY);
        width = Math.abs(endX - startX);
        height = Math.abs(endY - startY);
        ctx.putImageData(savedImage,0,0)
        copiedImage = ctx.getImageData(x, y, width, height);
        
        ctx.clearRect(x, y, width, height);
    } 
    isDrawing = false

}

const handleTyping = (e) => {
    isTyping = true

    const editor = document.createElement('div')
    editor.contentEditable = true
    editor.className = 'text-editor'
    editor.style.left = (e.offsetX+135) + 'px';
    editor.style.top = (e.offsetY+36) +'px'
    document.body.appendChild(editor)
    editor.focus()
    const finishText = () => {
        const text = editor.innerText.trim();
        if (text) {
          // Set your canvas text styles.
          ctx.font =  '30px ' + choosenFont
          ctx.fillStyle = 'black';
          // Draw the text at the same position where the editor was created.
          const x = e.offsetX;
          const y = e.offsetY;
          ctx.fillText(text, x-(text.length/2)*15, y+30/2);
        }
        document.body.removeChild(editor);
        isTyping = false;
      };
      editor.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          finishText();
        }
      });

}

const downloadCanvas = () => {
    const link = document.createElement('a');
    link.download = 'canvas.png';
    link.href = canvas.toDataURL();
    link.click();
}
document.getElementById('uploadImage').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => ctx.drawImage(img, 0, 0);
      };
      reader.readAsDataURL(file);
    }
  });

  const saveState = () => {
    history.push(canvas.toDataURL())
    redoStack=[]
  }

  function undo() {
    if (history.length > 0) {
      // Save current state to redoStack before undoing
      redoStack.push(canvas.toDataURL())
      // Get the previous state
      let previousState = history.pop()
      const img = new Image();
      img.src = previousState;
      img.onload = () => {
        // Clear the canvas and restore the state
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
      };
    }
  }

  function redo() {
    if (redoStack.length > 0) {
      // Save current state to history before redoing
      history.push(canvas.toDataURL())
      const nextState = redoStack.pop()
      const img = new Image()
      img.src = nextState
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
      };
    }
  }

// Drawing Logic Event
canvas.addEventListener('mousedown',startDrawing)
canvas.addEventListener('mouseup', stopDrawing)
canvas.addEventListener('mousemove',drawing)
canvas.addEventListener('click', (e) => {
    if (selectedTool === 'Text' && !isTyping) {
        handleTyping(e)
    }
})

document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click',() => {
        choosenFont = font[item.getAttribute('value')-1]
        console.log(choosenFont)
    })
});

document.querySelector('#brushSize').addEventListener('change',(e) => {
    ctx.lineWidth = e.target.value
})



// README.MD 
// 1. no hoisting for arrow function
// 2. canvas set width and height in html