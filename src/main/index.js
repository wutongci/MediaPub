'use strict'

import {app, BrowserWindow, Menu, shell, Tray, Notification} from 'electron'
// package.json
import pkg from '../../package.json'
import initIpcEvent from './modules/ipcEvent'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

// const path = require('path')
const ApplicationName = pkg.name

// 托盘对象
let appTray = null
// 是否可以退出
let trayClose = false
// 系统托盘右键菜单
let trayMenuTemplate
// 系统托盘图标
let iconPath
// 图标的上上下文
let contextMenu
// 图标闪烁定时器
let flashTrayTimer

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    // show: false,
    height: 1000,
    width: 1600,
    minWidth: 900,
    minHeight: 600,
    useContentSize: true,
    // frame: false, // 无边框
    transparent: true, // 透明
    // fullscreen: true, // 全屏
    webPreferences: {
      nodeIntegration: true
      // webSecurity: false,
      // allowRunningInsecureContent: true
    }
  })

  mainWindow.loadURL(winURL)

  mainWindow.webContents.once('dom-ready', () => {
    mainWindow.webContents.openDevTools()
  })

  // 初始化进程之间事件监听
  initIpcEvent()
  global.mainWindow = mainWindow
  /**
   * 监听
   */

  mainWindow.on('close', (event) => {
    if (process.platform === 'win32') {
      if (!trayClose) {
        // 最小化
        mainWindow.hide()
        event.preventDefault()
      }
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.on('maximize', () => {

  })
}

/**
 * 设置系统托盘
 */
function createTray () {
  // 是否可以退出
  trayClose = false

  // 系统托盘图标
  iconPath = `${__static}/logoNotWin.png`
  let iconMessagePath = `${__static}/iconMessageNotWin.png`
  let iconTransparentPath = `${__static}/iconTransparentNotWin.png`
  // 通知图标
  const iconNoticePath = `${__static}/logo.png`

  if (process.platform === 'win32') {
    iconPath = `${__static}/logo.ico`
    iconMessagePath = `${__static}/iconMessage.ico`
    iconTransparentPath = `${__static}/iconTransparent.ico`
  }

  // 系统托盘右键菜单
  trayMenuTemplate = [
    {
      label: '托盘闪烁',
      click: function () {
        // 判断如果上一个定时器是否执行完
        if (flashTrayTimer) {
          return
        }

        // 系统托盘图标闪烁
        appTray.setImage(iconMessagePath)
        let count = 0
        flashTrayTimer = setInterval(function () {
          count++
          if (count % 2 === 0) {
            appTray.setImage(iconTransparentPath)
          } else {
            appTray.setImage(iconMessagePath)
          }
        }, 600)
      }
    },
    {
      label: '弹出通知',
      click: function () {
        console.log(Notification.isSupported())
        let notification = new Notification({
          title: '通知的标题', // 通知的标题, 将在通知窗口的顶部显示
          body: '通知的正文文本', // 通知的正文文本, 将显示在标题或副标题下面
          icon: iconNoticePath, // 用于在该通知上显示的图标
          silent: true // 在显示通知时是否发出系统提示音
        })

        notification.show()
        notification.on('click', () => {
          notification.close()
          console.log('click notification')
        })
      }
    },
    {
      label: '关于项目',
      click: function () {
        // 打开外部链接
        shell.openExternal('https://github.com/wutongci/zeus-book')
      }
    },
    {
      label: '退出',
      click: function () {
        // 退出
        trayClose = true
        app.quit()
      }
    }
  ]

  appTray = new Tray(iconPath)
  // 图标的上上下文
  contextMenu = Menu.buildFromTemplate(trayMenuTemplate)
  // 设置此托盘图标的悬停提示内容
  appTray.setToolTip(ApplicationName)
  // 设置此图标的上下文菜单
  appTray.setContextMenu(contextMenu)
  // 主窗口显示隐藏切换
  appTray.on('click', () => {
    // 清楚图标闪烁定时器
    clearInterval(flashTrayTimer)
    flashTrayTimer = null
    // 还原图标
    appTray.setImage(iconPath)
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
  })
}

app.on('ready', () => {
  createWindow()
  createTray()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
