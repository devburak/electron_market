'use strict'

const path = require('path')
const { app, ipcMain } = require('electron')

const Window = require('./Window')
const unhandled = require('electron-unhandled');
unhandled();

function createWindow () {
  // Create the browser window.
  let win = new BrowserWindow({ width: 800, height: 600 })
//   win.setMenu(null);
  // and load the index.html of the app.
  win.loadFile('index.html')
}

function main () {
  // todo list window
  let mainWindow = new Window({
    file: path.join('renderer', 'index.html')
  })

let configWin,barkodWin
  // create add todo window
  ipcMain.on('config-window', () => {
    // if addTodoWin does not already exist
    if (!configWin) {
      // create a new add todo window
      configWin = new Window({
        file: path.join('renderer', 'config.html'),
        width: 550,
        height: 650,
        // close with the main window
        parent: mainWindow
      })

      // cleanup
      configWin.on('closed', () => {
        configWin = null
      })
    }
  })

  // create add todo window
  ipcMain.on('barcode-window', () => {
    // if addTodoWin does not already exist
    if (!configWin) {
      // create a new add todo window
      barkodWin = new Window({
        file: path.join('renderer', 'createbarcode.html'),
        width: 550,
        height: 780,
        // close with the main window
        parent: mainWindow
      })

      // cleanup
      barkodWin.on('closed', () => {
        barkodWin = null
      })
    }
  })
  
}
  

  app.on('ready', main);

  app.on('window-all-closed', function () {
    app.quit()
  })