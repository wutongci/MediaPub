import { ipcMain } from 'electron'

export default function () {
  ipcMain.on('download-start', (e, args) => {
    let url = 'response:' + args.url
    console.log('send download msg')
  })
}
