import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'
  
  return {
    plugins: [
      vue(),
      vueDevTools(),
      viteSingleFile(),
      
      {
        name: 'favicon-handler',
        transformIndexHtml(html : string) {
          if (isProduction) {
            // 生产环境移除图标标签
            return html.replace(/<link rel="icon".*?>/g, '')
            
            //隐藏鼠标代码
            // .replace(
            //   '</head>',
            //   '<style>.player-instance{cursor: none;}</style></head>'
            // )
          } else {
            // 开发环境注入图标链接
            return html.replace(
              '</head>',
              '<link rel="icon" href="/favicon.ico" /></head>'
            )
          }
        }
      },
    ],
    server: {
      fs: {
        allow: ['..'] // 允许访问根目录
      }
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    build: {
      cssCodeSplit: false,
    },
  }
})
