import {ipcRenderer} from 'electron'
import Message from 'ant-design-vue/es/message'

let state = {
  downloaded: [],
  downloading: [],
  queue: []
}

let getters = {
  queueIds: state => state.queue.map(item => item.id)
}

let mutations = {
  SET_QUEUE (state, urls) {
    state.queue = urls
  },
  REMOVE_QUEUE (state, url) {
    let index = state.queue.findIndex(item => item.id === url.id)
    state.queue.splice(index, 1)
  },
  SET_DOWNLOADED (state, urls) {
    state.downloaded = urls
  },
  ADD_DOWNLOADING (state, url) {
    state.downloading.push(url)
  },
  REMOVE_DOWNLOADING (state, url) {
    let index = state.downloading.findIndex(item => item.id === url.id)
    state.downloading.splice(index, 1)
  },
  UPDATE_DOWNLOADING_PROGRESS (state, {id, progress}) {
    let index = state.downloading.findIndex(item => item.id === id)
    state.downloading[index] && (state.downloading[index].downloadPercent = progress)
  }
}

let actions = {
  init ({dispatch, commit, state}) {
    ipcRenderer.on('download-onStarted', (event, data) => {
      let {song, totalBytes} = data

      commit('ADD_DOWNLOADING', {
        ...song,
        downloadPercent: 0,
        totalBytes
      })
    })

    ipcRenderer.on('download-success', (event, data) => {
      let { url } = data
      commit('REMOVE_QUEUE', url)
      dispatch('download')
    })
  },
  async download ({dispatch, commit, state, rootState}) {
    if (!state.queue.length) {
      Message.success('全本下载完毕!')
      return
    }
    let queue = state.queue
    let downloadUrl = queue[0]
    try {
      ipcRenderer.send('download-start', {
        url: downloadUrl
      })
    } catch (err) {
      Message.error('下载失败' + err)
      commit('REMOVE_QUEUE', downloadUrl)
      dispatch('download')
    }
  },
  adddownloadQueue ({commit, dispatch, state}, urls) {
    console.log('ssss' + urls)
    let queue = [...state.queue]
    urls = urls.filter(url => {
      return !queue.some(item => item.id === url.id)
    })
    if (urls.length) {
      queue.push(...urls)
      commit('SET_QUEUE', queue)
      Message.success(`添加${urls.length}URL到下载列表`)
    }
    if (state.queue.length > 0 && !state.downloading.length) {
      dispatch('download')
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
