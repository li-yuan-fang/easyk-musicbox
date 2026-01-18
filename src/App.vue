<template>
  <!-- 主容器 -->
  <div class="player-container">

    <div class="player-panel">
      <!-- 主面板 -->
      <div class="player-panel-main" ref="panel_main">
        <!-- 黑胶唱片区域 -->
        <div class="player-vinyl-container">
          <div class="player-vinyl-wrapper">
            <div class="player-vinyl-light-spot" style="top: 20vh;" />
            <div class="player-vinyl-light-spot" style="top: -20vh;" />
            <div
              class="player-vinyl"
              :style="{ animationPlayState: playing ? 'running' : 'paused' }"
            >
              <img
                v-if="album?.length > 0"
                class="player-album"
                :src="album"
              >
            </div>
          </div>
        </div>

        <div class="player-title-container">
          <h2 class="player-title">{{ title }}</h2>
          <p class="player-artist">{{ artist }}</p>
        </div>

        <div class="player-progress-container">
          <span class="player-progress-current">{{ formatTime(current * total) }}</span>
          <input
            class="player-progress-bar"
            :value="Math.round(current * 1000)"
            type="range"
            min="0"
            max="1000"
            :style="{ backgroundSize: `${(current * 100).toFixed(1)}% 100%` }"
          >
          <span class="player-progress-total">{{ formatTime(total) }}</span>
        </div>
      </div>

      <!-- 歌词面板 -->
      <div class="player-panel-lyrics-space" v-if="lyrics.length > 0" />
      <div class="player-panel-lyrics" v-if="lyrics.length > 0">
        <div
          class="player-lyrics-wrapper"
          :style="{ transform: `translateY(calc(${getHalfHeight()}px - ${calcActiveSublines()} * var(--player-lyric-font-size-common) * var(--player-lyric-line-height-rate) - ${active_lyric} * 2 * var(--player-lyric-line-padding) - var(--player-lyric-font-size-active) * ${lyrics[active_lyric]?.text.length || 0} / 2 - var(--player-lyric-line-padding)))` }"
        >
          <div 
            v-for="(line, index) in lyrics" 
            :key="index"
            :class="{ 
              'player-lyric-line-active': index === active_lyric
            }"
            class="player-lyric-line"
          >
            <div
              v-for="(ver, j) in line.text"
              :key="j"
              class="player-lyric-text"
            >
              {{ ver }}
            </div>
          </div>
        </div>
      </div>
    </div>
    
  </div>

  <!-- 背景容器 -->
  <div class="player-background">
    <div
      v-if="album?.length > 0"
      class="player-background-album"
      :style="{ backgroundImage: `url(${album})` }"
    />
    <div
      v-else
      class="player-background-default"
    >
      <div class="player-background-default-gradient" />
      <div class="player-background-default-noise" />
      <div class="player-background-default-grid" />
      <div class="player-background-default-light-effect" />
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

interface Lyrics {
  time: number;
  text: Array<string>;
}

const panel_main = ref()

const getHalfHeight = () : number => (panel_main.value?.offsetHeight / 2) || 0

//标题
const title = ref<string>('')
//创作者
const artist = ref<string>('')
//专辑封面
const album = ref<string>('')

//播放状态
const playing = ref<boolean>(false)
//播放进度(0-1)
const current = ref<number>(0)
//总长度(单位:s)
const total = ref<number>(0)

//歌词
const lyrics = ref<Array<Lyrics>>([])

//标题
// const title = ref<string>('キズナミュージック♪')
// //创作者
// const artist = ref<string>('Poppin\'Party')
// //专辑封面
// const album = ref<string>('https://y.gtimg.cn/music/photo_new/T002R800x800M000001Tmvdn32xpAO_3.jpg')

// //播放状态
// const playing = ref<boolean>(true)
// //播放进度(0-1)
// const current = ref<number>(0)
// //总长度(单位:s)
// const total = ref<number>(315)

// //歌词
// const lyrics = ref<Array<Lyrics>>([{"time":0.0,"text":[" 作词 : 中村航"]},{"time":1.0,"text":[" 作曲 : 藤永龍太郎"]},{"time":2.0,"text":[" 编曲 : 藤永龍太郎"]},{"time":10.79,"text":["教室の窓の外 はしゃぐ声","教室窗外传来嬉闹的声音"]},{"time":15.65,"text":["木漏れ日は キラ キラ降り注いで","树叶空隙的阳光显得格外闪耀"]},{"time":20.86,"text":["毎日が特別だった場所に","在这每日都格外特殊的地方"]},{"time":25.81,"text":["みんな また集まってた","大家又聚集在一起"]},{"time":29.89,"text":["わたしたちが つながってる意味","我们故事交互的意义"]},{"time":36.02,"text":["たぶん…偶然じゃない","应该...并非是偶然"]},{"time":39.74,"text":["だ って音を合わせたら——","如果音符交织在一起的话——"]},{"time":45.66,"text":["キズナミュージック?","Kizuna music?"]},{"time":48.25,"text":["ただひたむきに 追いかけていた","只是想一心不乱的追赶"]},{"time":53.38,"text":["胸の奥の思い 気づいたら","内心深处的想法，也终于发觉"]},{"time":58.18,"text":["（みんなで）地図を広げて","（与大家）拿出地图"]},{"time":61.43,"text":["キボウの道を ジグザグ進もう！","在希望的道路上 曲曲折折的前进！"]},{"time":65.83,"text":["キズナミュージック?","Kizuna music?"]},{"time":68.56,"text":["大好きな歌 約束の歌 永遠の歌","那最棒的歌 那约定的歌 那永远的歌"]},{"time":76.25,"text":["届けよう！わたしたちいつだって","传递吧！我们永远都会"]},{"time":81.01,"text":["精一杯！Forever for dreaming！","竭尽全力！Forever for dreaming！"]},{"time":85.53,"text":["夢の向こうへ——","向着梦想前进——"]},{"time":96.93,"text":["出会ったときのこと 覚えている？","相遇的场景 你还铭记于心吗？"]},{"time":101.97,"text":["あふれだす思い 響きあう夢","思绪泛滥 梦想的回响"]},{"time":107.14,"text":["気づいたら 傷ついて傷つけて","回过头来 虽然伤痕累累"]},{"time":112.14,"text":["絆 また深まってた","但羁绊 继续升华"]},{"time":116.00999999999999,"text":["五人だけが 知っていること","仅仅知道我们有五个人"]},{"time":122.29,"text":["たぶん…すぐ思いだす","应该...做些什么呢"]},{"time":126.08,"text":["歌が教えてくれるよ","音乐会告诉你的哟"]},{"time":131.96,"text":["キズナミュージック?","Kizuna music?"]},{"time":134.7,"text":["あの 橋渡リ あの丘を越え","度过桥梁 跨越山丘"]},{"time":139.71,"text":["その壁を越えたら キミがいた","突破那阻碍 有你在"]},{"time":144.71,"text":["（会いたね）標識のない","（想念）没有迹象"]},{"time":147.76,"text":["迷いの道も キミとなら行ける","在这迷茫的道路上你与我形影不离"]},{"time":152.2,"text":["キズナミュージック?","Kizuna music?"]},{"time":155.05,"text":["大切な歌 青春の歌 始まりの歌","那珍贵的歌 那青春之曲 那初生的歌"]},{"time":162.59,"text":["奏でよう！何度でもいつまでも","一同演奏 不管多少次都"]},{"time":167.38,"text":["精一杯！Forever for dreaming！","竭尽全力 Forever for dreaming"]},{"time":171.93,"text":["歌を信じる——","相信着这歌声——"]},{"time":217.05,"text":["いつか 思い出に変わったとき","总有一 天 会变成回忆的时候"]},{"time":224.07,"text":["この歌を聴いたなら","当再次听到这首歌的时候"]},{"time":227.54,"text":["どんなことを感じるかな？","会是怎样的心情呢？"]},{"time":231.4,"text":["愛しくて 優しく 嬉しくて 切なかった","怜爱 温柔 喜悦 悲伤什么的"]},{"time":238.14,"text":["思いすべて 抱きしめ——","我都会一并接受——"]},{"time":245.55,"text":["キズナ ミュージック?","Kizuna music?"]},{"time":247.83,"text":["心震えて 勇気あふれて","心跳不已 无所畏惧"]},{"time":252.93,"text":["涙がでちゃいそう","热泪盈眶"]},{"time":256.39,"text":["歌おうよ（みんなで）声高らかに","歌唱吧（与大家）去高歌"]},{"time":260.83,"text":["明日の歌を 未来への歌を！","向着明日未来而歌唱！"]},{"time":265.59,"text":["そんな…","这样的..."]},{"time":268.86,"text":["ミュージック?","Music?"]},{"time":270.72,"text":["大好きな歌 約束の歌 永遠の歌","那最棒的歌 那约定的歌 那永远的歌"]},{"time":278.25,"text":["届けよう！わたしたちいつだって","传递吧！我们永远都会"]},{"time":282.88,"text":["精一杯！Forever for dreaming！","竭尽全力！Forever for dreaming！"]},{"time":286.93,"text":["キミと一緒だよ","你也一同！"]},{"time":289.46,"text":["Forever for dreaming！","Forever for dreaming！"]},{"time":292.77,"text":["キミを 信じる——","我相信着你——"]}])

// onMounted(() => {
//   let interval = setInterval(() => {
//     current.value += 1 / total.value
//     if (current.value >= 1) {
//       playing.value = false
//       clearInterval(interval)
//     }
//   }, 1000)
// })

//格式化时间
const formatTime = (seconds : number) => {
  let min = Math.floor(seconds / 60)
  let sec = Math.round(seconds % 60)
  return `${min}:${sec < 10 ? '0' + sec : sec}`
}

const active_lyric = ref<number>(0)

const calcActiveSublines = () : number => {
  let sum = 0
  for (let i = 0; i < active_lyric.value; i++) {
    sum += lyrics.value[i]?.text.length || 0
  }
  return sum
}

const updateLyric = (value : number) => {
  if (lyrics.value.length == 0) return

  let active : number = 0
  
  value *= total.value
  try {
    lyrics.value.forEach((line, index) => {
      if (value >= line.time) {
        active = index
      } else {
        throw new DOMException()
      }
    })
  } catch {
  }

  active_lyric.value = active
}

watch(current, updateLyric)

const setTitle = (t : string) => title.value = t

const setArtist = (a : string) => artist.value = a

const setAlbum = (a : string) => album.value = a

const setPlaying = (p : boolean) => playing.value = p

const setCurrent = (c : number) => current.value = c

const setTotal = (t : number) => total.value = t

const setLyric = (id : string, lrc : Array<Lyrics>) => {
  switch (id) {
    case 'Netease':
      lyrics.value = lrc
      updateLyric(current.value)
      break
  }
}

//拉取状态定时器
const intervalState = ref()

//拉取状态
const pullState = () => {
  easy_k.queryState()

  if (current.value >= 1)
    clearInterval(intervalState.value)
}

onMounted(() => {
  //暴露方法到外部
  window['setTitle'] = setTitle
  window['setArtist'] = setArtist
  window['setAlbum'] = setAlbum
  window['setPlaying'] = setPlaying
  window['setCurrent'] = setCurrent
  window['setTotal'] = setTotal
  window['setLyric'] = setLyric

  //拉取基本信息
  easy_k.queryMusic()

  intervalState.value = setInterval(pullState, 300)
})

</script>

<style scoped>

.player-background {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;

  display: flex;
  z-index: 0;
}

.player-background-album {
  flex: 1;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: blur(20px);
}

.player-background-default {
  background: #1a1a2e;
}

/* 主背景渐变层 */
.player-background-default-gradient {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 20% 30%, rgba(86, 76, 163, 0.4) 0%, transparent 40%),
    radial-gradient(ellipse at 80% 70%, rgba(162, 76, 140, 0.3) 0%, transparent 45%),
    radial-gradient(ellipse at 40% 80%, rgba(76, 126, 163, 0.2) 0%, transparent 50%),
    linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f1123 100%);
    filter: blur(1px);
}

/* 噪点纹理层 */
.player-background-default-noise {
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(circle at 25% 25%, rgba(255,255,255,0.03) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(255,255,255,0.02) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(255,255,255,0.01) 0%, transparent 70%),
    url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.1'/%3E%3C/svg%3E");
  mix-blend-mode: overlay;
  opacity: 0.6;
}

/* 网格纹理 */
.player-background-default-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 5.3vh 5.3vh;
  opacity: 0.3;
}

/* 动态渐变光效 */
.player-background-default-light-effect {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 20%, rgba(102, 126, 234, 0.15) 0%, transparent 40%),
              radial-gradient(circle at 70% 60%, rgba(118, 75, 162, 0.1) 0%, transparent 45%);
  animation: background-pulse 15s ease-in-out infinite;
}

@keyframes background-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.5;
  }
}

.player-container {
  position: fixed;
  width: 100%;
  height: 100%;

  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);

  color: #fff;
  font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
  overflow: hidden;
  
  z-index: 10;
}

.player-panel {
  display: flex;
  position: relative;
  --player-lyrics-width: 35vw;
}

.player-panel-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.player-vinyl-container {
  position: relative;
  border-radius: 50%;
  margin: 0;
  box-shadow: 0 0 4vh rgba(0, 0, 0, 0.55);
}

.player-vinyl-wrapper {
  position: relative;
  overflow: hidden;
  border-radius: 50%;
}

/* 光斑效果 */
.player-vinyl-light-spot {
  position: absolute;
  width: 24vh;
  height: 40vh;
  background: radial-gradient(ellipse at center, 
    rgba(255, 255, 255, 0.35) 0%, 
    transparent 70%);
  border-radius: 50%;
  left: 50%;
  transform: translateX(-50%);
  filter: blur(1.6vh);
  z-index: 13;
}

.player-vinyl {
  width: 40vh;
  height: 40vh;
  border-radius: 50%;
  background: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;

  background-image: repeating-radial-gradient(
    circle at center,
    transparent 0,
    transparent 0.13vh,
    rgba(255, 255, 255, 0.1) 0.13vh,
    rgba(255, 255, 255, 0.06) 0.26vh
  );

  animation: vinyl-rotate 20s linear infinite;
}

@keyframes vinyl-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.player-vinyl::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 16vh;
  height: 16vh;
  border-radius: 50%;
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  box-shadow: inset 0 0 2.6vh rgba(0, 0, 0, 0.4);
  z-index: 11;
}

.player-vinyl::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 3vh;
  height: 3vh;
  border-radius: 50%;
  background: #222;
  z-index: 12;
}

.player-album {
  width: 26vh;
  height: 26vh;
  border-radius: 50%;
  object-fit: cover;
  z-index: 14;
}

.player-title-container {
  text-align: center;
  margin: 5vh 0 2vh 0;
}

.player-title {
  font-size: max(2.6vh, 1.25rem);
  font-weight: 500;
  color: #fff;
  margin: 0 0 0.6vh 0;
}

.player-artist {
  font-size: max(2.1vh, 1rem);
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.player-progress-container {
  display: flex;
  align-items: center;
  gap: 1.6vh;
  width: 100%;
  margin: 0;
}

.player-progress-bar {
  flex: 1;
  height: 0.5vh;
  -webkit-appearance: none;
  user-select: none;
  pointer-events: none;
  border-radius: 0.25vh;
  outline: none;
  background: -webkit-linear-gradient(rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.7)) no-repeat,
          rgba(255, 255, 255, 0.4);
}

/* 滑块 */
.player-progress-bar::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 1.6vh;
  height: 1.6vh;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 0 1vh rgba(0, 0, 0, 0.3);
}

.player-progress-current, .player-progress-total {
  font-size: max(1.8vh, 0.875rem);
}

/* 歌词容器 */
.player-panel-lyrics {
  position: absolute;
  right: 0;
  top: 0;
  width: var(--player-lyrics-width);
  height: 100%;

  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 20%,
    black 80%,
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 20%,
    black 80%,
    transparent 100%
  );

  --player-lyric-line-padding: 2.5vh;
  --player-lyric-line-height-rate: 1.5;
  --player-lyric-font-size-common: max(1.2rem, 2.56vh);
  --player-lyric-font-size-active: max(1.5rem, 3.2vh);
}


.player-panel-lyrics-space {
  display: block;
  width: calc(var(--player-lyrics-width) + 15vh);
  height: 100%;
}

.player-lyrics-wrapper {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 歌词行 */
.player-lyric-line {
  padding: var(--player-lyric-line-padding) 0;
  text-align: center;
  color: #fff;
  opacity: 0.4;
  transition: all 0.2s ease;
  font-size: var(--player-lyric-font-size-common);
}

.player-lyric-line-active {
  opacity: 1;
  text-shadow:
    max(-1px, -0.13vh) max(-1px, -0.13vh) 0 rgba(0, 0, 0, 0.1),  
    min(1px, 0.13vh) max(-1px, -0.13vh) 0 rgba(0, 0, 0, 0.1),
    max(-1px, -0.13vh) min(1px, 0.13vh) 0 rgba(0, 0, 0, 0.1),
    min(1px, 0.13vh) min(1px, 0.13vh) 0 rgba(0, 0, 0, 0.1);
  font-size: var(--player-lyric-font-size-active);
}

/* 歌词文本 */
.player-lyric-text {
  line-height: var(--player-lyric-line-height-rate);
  transition: all 0.2s ease;
}

</style>
