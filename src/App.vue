<template>
  <!-- 主容器 -->
  <div class="player-container player-instance">

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
      <div class="player-panel-lyrics-space" v-if="lyric_valid()" />
      <div class="player-panel-lyrics" v-if="lyric_valid()">
        <div
          class="player-lyrics-wrapper"
          :style="{
            transform: `translateY(${getLyricTranslation()}px)`,
            '--player-lyric-read': lyric_color
          }"
        >
          <div
            v-for="(line, index) in lyrics" 
            :key="index"
            :class="{ 
              'player-lyric-line-active': index === active_lyric
            }"
            class="player-lyric-line"
          >
            <!-- 带假名逐字行 -->
            <div class="player-lyric-wrapper player-lyric-verbatim-kana player-lyric-inline">
              <div
                v-for="(vk, j) in (line.verbatimK || [])"
                :key="j"
                class="player-lyric-verbatim-main"
              >
                <div class="player-lyric-inline">
                  <div
                    v-for="(kana, k) in (vk.kana || [])"
                    :key="k"
                    class="player-lyric-kana player-lyric-verbatim player-lyric-inline"
                    :style="calcVerbatimBackground(kana, index)"
                  >
                    {{ kana.content }}
                  </div>
                </div>
                <div
                  class="player-lyric-verbatim"
                  :style="calcVerbatimBackground(vk, index)"
                >
                  {{ vk.content }}
                </div>
              </div>
            </div>
            <!-- 逐字行 -->
            <div class="player-lyric-wrapper player-lyric-inline player-lyric-text">
              <div
                v-for="(v, j) in (line.verbatim || [])"
                :key="j"
                class="player-lyric-verbatim player-lyric-roma"
                :style="calcVerbatimBackground(v, index)"
              >
                {{ v.content }}
              </div>
            </div>
            <!-- 简易行 -->
            <div
              v-for="(p, j) in (line.plain || [])"
              :key="j"
              class="player-lyric-text"
            >
              {{ p }}
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
import { Mutex } from 'async-mutex';
import { ref, onMounted } from 'vue'
import type { Kana, LyricLine, VerbatimLyric } from './common/types';

const panel_main = ref()

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
//播放速度
const rate = ref<number>(1.0)
//总长度(单位:s)
const total = ref<number>(0)

//进度锚点锁
const anchor_lock = new Mutex()
//进度锚点(0-1)
const anchor_pos = ref<number>(0)
//进度锚点时间戳(单位:ms)
const anchor_time = ref<number>(0)

//进度状态定时器
const intervalState = ref()

//歌词
const lyrics = ref<Array<LyricLine>>([])
//歌词颜色
const lyric_color = ref<string>('#fff')

const lyric_valid = () : boolean => lyrics.value.length > 0

// //标题
// const title = ref<string>('キズナミュージック♪')
// //创作者
// const artist = ref<string>('Poppin\'Party')
// //专辑封面
// const album = ref<string>('https://y.gtimg.cn/music/photo_new/T002R800x800M000001Tmvdn32xpAO_3.jpg')

// //播放状态
// const playing = ref<boolean>(true)
// //播放进度(0-1)
// const current = ref<number>(0)
// //播放速度
// const rate = ref<number>(1.0)
// //总长度(单位:s)
// const total = ref<number>(315)

// //歌词
// const lyrics = ref<Array<LyricLine>>([{"time":349.0,"verbatimK":[{"kana":[],"start":349.0,"end":629.0,"content":"キ"},{"kana":[],"start":629.0,"end":880.0,"content":"ズ"},{"kana":[],"start":880.0,"end":1085.0,"content":"ナ"},{"kana":[],"start":1085.0,"end":1142.0,"content":"ミ"},{"kana":[],"start":1143.0,"end":1200.0,"content":"ュ"},{"kana":[],"start":1200.0,"end":1257.0,"content":"ー"},{"kana":[],"start":1258.0,"end":1351.0,"content":"ジ"},{"kana":[],"start":1352.0,"end":1445.0,"content":"ッ"},{"kana":[],"start":1445.0,"end":1638.0,"content":"ク"},{"kana":[],"start":1638.0,"end":1821.0,"content":"? ("},{"kana":[],"start":1821.0,"end":2011.0,"content":"Kizuna "},{"kana":[],"start":2011.0,"end":2190.0,"content":"Music?) "},{"kana":[],"start":2190.0,"end":2190.0,"content":"- "},{"kana":[],"start":2190.0,"end":2389.0,"content":"Poppin'Party"}],"verbatim":null},{"time":2389.0,"verbatimK":[{"kana":[{"start":2389.0,"end":2590.0,"content":"し"}],"start":2389.0,"end":2590.0,"content":"词"},{"kana":[],"start":2590.0,"end":2590.0,"content":"："},{"kana":[{"start":2590.0,"end":2821.0,"content":"な"},{"start":2821.0,"end":3073.0,"content":"か"}],"start":2590.0,"end":3073.0,"content":"中"},{"kana":[{"start":3073.0,"end":3317.0,"content":"む"},{"start":3317.0,"end":3509.0,"content":"ら"}],"start":3073.0,"end":3509.0,"content":"村"},{"kana":[{"start":3509.0,"end":3743.0,"content":"こう"}],"start":3509.0,"end":3743.0,"content":"航"}],"verbatim":null},{"time":3743.0,"verbatimK":[{"kana":[{"start":3743.0,"end":3858.0,"content":"き"},{"start":3859.0,"end":3974.0,"content":"ょ"},{"start":3974.0,"end":4229.0,"content":"く"}],"start":3743.0,"end":4229.0,"content":"曲"},{"kana":[],"start":4229.0,"end":4229.0,"content":"："},{"kana":[{"start":4229.0,"end":4453.0,"content":"ふ"},{"start":4453.0,"end":4717.0,"content":"じ"}],"start":4229.0,"end":4717.0,"content":"藤"},{"kana":[{"start":4717.0,"end":5270.0,"content":"なが"}],"start":4717.0,"end":5270.0,"content":"永"},{"kana":[{"start":5270.0,"end":5582.0,"content":"りゅう"}],"start":5270.0,"end":5582.0,"content":"龍"},{"kana":[{"start":5582.0,"end":5901.0,"content":"た"}],"start":5582.0,"end":5901.0,"content":"太"},{"kana":[{"start":5901.0,"end":6263.0,"content":"ろう"}],"start":5901.0,"end":6263.0,"content":"郎"}],"verbatim":null},{"time":6263.0,"verbatimK":[{"kana":[],"start":6263.0,"end":6701.0,"content":"编"},{"kana":[{"start":6701.0,"end":6849.0,"content":"き"},{"start":6850.0,"end":6998.0,"content":"ょ"},{"start":6998.0,"end":7301.0,"content":"く"}],"start":6701.0,"end":7301.0,"content":"曲"},{"kana":[],"start":7301.0,"end":7301.0,"content":"："},{"kana":[{"start":7301.0,"end":7621.0,"content":"ふ"},{"start":7621.0,"end":7898.0,"content":"じ"}],"start":7301.0,"end":7898.0,"content":"藤"},{"kana":[{"start":7898.0,"end":8141.0,"content":"な"},{"start":8141.0,"end":8477.0,"content":"が"}],"start":7898.0,"end":8477.0,"content":"永"},{"kana":[{"start":8477.0,"end":8814.0,"content":"りゅう"}],"start":8477.0,"end":8814.0,"content":"龍"},{"kana":[{"start":8814.0,"end":9398.0,"content":"た"}],"start":8814.0,"end":9398.0,"content":"太"},{"kana":[{"start":9398.0,"end":10429.0,"content":"ろう"}],"start":9398.0,"end":10429.0,"content":"郎"}],"verbatim":null},{"time":10429.0,"plain":["教室的窗外 传来欢快的声音"],"verbatimK":[{"kana":[{"start":10429.0,"end":10781.0,"content":"きょう"}],"start":10429.0,"end":10781.0,"content":"教"},{"kana":[{"start":10781.0,"end":11301.0,"content":"しつ"}],"start":10781.0,"end":11301.0,"content":"室"},{"kana":[],"start":11301.0,"end":11581.0,"content":"の"},{"kana":[{"start":11581.0,"end":11934.0,"content":"ま"},{"start":11934.0,"end":12359.0,"content":"ど"}],"start":11581.0,"end":12359.0,"content":"窓"},{"kana":[],"start":12359.0,"end":12693.0,"content":"の"},{"kana":[{"start":12693.0,"end":12973.0,"content":"そ"},{"start":12973.0,"end":13357.0,"content":"と"}],"start":12693.0,"end":13357.0,"content":"外"},{"kana":[],"start":13357.0,"end":13357.0,"content":" "},{"kana":[],"start":13357.0,"end":13621.0,"content":"は"},{"kana":[],"start":13621.0,"end":13733.0,"content":"し"},{"kana":[],"start":13733.0,"end":13845.0,"content":"ゃ"},{"kana":[],"start":13845.0,"end":14122.0,"content":"ぐ"},{"kana":[{"start":14122.0,"end":14478.0,"content":"こ"},{"start":14478.0,"end":15309.0,"content":"え"}],"start":14122.0,"end":15309.0,"content":"声"}],"verbatim":null},{"time":15620.0,"plain":["叶隙透暖阳 带着斑斓的光辉"],"verbatimK":[{"kana":[{"start":15620.0,"end":15788.0,"content":"こ"}],"start":15620.0,"end":15788.0,"content":"木"},{"kana":[{"start":15788.0,"end":15996.0,"content":"も"}],"start":15788.0,"end":15996.0,"content":"漏"},{"kana":[],"start":15996.0,"end":16224.0,"content":"れ"},{"kana":[{"start":16224.0,"end":16444.0,"content":"び"}],"start":16224.0,"end":16444.0,"content":"日"},{"kana":[],"start":16444.0,"end":16756.0,"content":"は"},{"kana":[],"start":16756.0,"end":16756.0,"content":" "},{"kana":[],"start":16756.0,"end":17044.0,"content":"キ"},{"kana":[],"start":17044.0,"end":17407.0,"content":"ラ"},{"kana":[],"start":17407.0,"end":17735.0,"content":"キ"},{"kana":[],"start":17735.0,"end":18028.0,"content":"ラ"},{"kana":[{"start":18028.0,"end":18358.0,"content":"ふ"}],"start":18028.0,"end":18358.0,"content":"降"},{"kana":[],"start":18358.0,"end":18645.0,"content":"り"},{"kana":[{"start":18645.0,"end":19164.0,"content":"そそ"}],"start":18645.0,"end":19164.0,"content":"注"},{"kana":[],"start":19164.0,"end":19596.0,"content":"い"},{"kana":[],"start":19596.0,"end":20496.0,"content":"で"}],"verbatim":null},{"time":20630.0,"plain":["在这里 每一天都不会平凡"],"verbatimK":[{"kana":[{"start":20630.0,"end":20990.0,"content":"まい"}],"start":20630.0,"end":20990.0,"content":"毎"},{"kana":[{"start":20990.0,"end":21406.0,"content":"にち"}],"start":20990.0,"end":21406.0,"content":"日"},{"kana":[],"start":21406.0,"end":21742.0,"content":"が"},{"kana":[{"start":21742.0,"end":22078.0,"content":"と"},{"start":22078.0,"end":22446.0,"content":"く"}],"start":21742.0,"end":22446.0,"content":"特"},{"kana":[{"start":22446.0,"end":22805.0,"content":"べ"},{"start":22805.0,"end":23135.0,"content":"つ"}],"start":22446.0,"end":23135.0,"content":"別"},{"kana":[],"start":23135.0,"end":23426.0,"content":"だ"},{"kana":[],"start":23427.0,"end":23718.0,"content":"っ"},{"kana":[],"start":23718.0,"end":23974.0,"content":"た"},{"kana":[{"start":23974.0,"end":24258.0,"content":"ば"}],"start":23974.0,"end":24258.0,"content":"場"},{"kana":[{"start":24258.0,"end":24598.0,"content":"しょ"}],"start":24258.0,"end":24598.0,"content":"所"},{"kana":[],"start":24598.0,"end":25518.0,"content":"に"}],"verbatim":null},{"time":25800.0,"plain":["而我们 今天又来到了这里"],"verbatimK":[{"kana":[],"start":25806.0,"end":25947.0,"content":"み"},{"kana":[],"start":25948.0,"end":26089.0,"content":"ん"},{"kana":[],"start":26089.0,"end":26665.0,"content":"な"},{"kana":[],"start":26665.0,"end":26665.0,"content":" "},{"kana":[],"start":26665.0,"end":26880.0,"content":"ま"},{"kana":[],"start":26880.0,"end":27089.0,"content":"た"},{"kana":[{"start":27089.0,"end":27294.0,"content":"あ"},{"start":27294.0,"end":27583.0,"content":"つ"}],"start":27089.0,"end":27583.0,"content":"集"},{"kana":[],"start":27583.0,"end":27878.0,"content":"ま"},{"kana":[],"start":27878.0,"end":28173.0,"content":"っ"},{"kana":[],"start":28174.0,"end":28574.0,"content":"て"},{"kana":[],"start":28574.0,"end":29319.0,"content":"た"}],"verbatim":null},{"time":29610.0,"plain":["我们为什么会走到一起"],"verbatimK":[{"kana":[],"start":29611.0,"end":29923.0,"content":"わ"},{"kana":[],"start":29923.0,"end":30414.0,"content":"た"},{"kana":[],"start":30414.0,"end":31026.0,"content":"し"},{"kana":[],"start":31026.0,"end":31535.0,"content":"た"},{"kana":[],"start":31535.0,"end":32045.0,"content":"ち"},{"kana":[],"start":32045.0,"end":33248.0,"content":"が"},{"kana":[],"start":33248.0,"end":33248.0,"content":" "},{"kana":[],"start":33248.0,"end":33529.0,"content":"つ"},{"kana":[],"start":33529.0,"end":33814.0,"content":"な"},{"kana":[],"start":33814.0,"end":33962.0,"content":"が"},{"kana":[],"start":33962.0,"end":34110.0,"content":"っ"},{"kana":[],"start":34110.0,"end":34326.0,"content":"て"},{"kana":[],"start":34326.0,"end":34534.0,"content":"る"},{"kana":[{"start":34534.0,"end":34830.0,"content":"い"}],"start":34534.0,"end":34830.0,"content":"意"},{"kana":[{"start":34830.0,"end":35510.0,"content":"み"}],"start":34830.0,"end":35510.0,"content":"味"}],"verbatim":null},{"time":35870.0,"plain":["恐怕不是简单的巧合"],"verbatimK":[{"kana":[],"start":35876.0,"end":36212.0,"content":"た"},{"kana":[],"start":36212.0,"end":36500.0,"content":"ぶ"},{"kana":[],"start":36500.0,"end":36788.0,"content":"ん"},{"kana":[],"start":36789.0,"end":37077.0,"content":" "},{"kana":[{"start":37077.0,"end":37485.0,"content":"ぐう"}],"start":37077.0,"end":37485.0,"content":"偶"},{"kana":[{"start":37485.0,"end":37993.0,"content":"ぜん"}],"start":37485.0,"end":37993.0,"content":"然"},{"kana":[],"start":37993.0,"end":38204.0,"content":"じ"},{"kana":[],"start":38204.0,"end":38415.0,"content":"ゃ"},{"kana":[],"start":38415.0,"end":38789.0,"content":"な"},{"kana":[],"start":38789.0,"end":39412.0,"content":"い"}],"verbatim":null},{"time":39730.0,"plain":["因为你听 我们乐声和鸣"],"verbatimK":[{"kana":[],"start":39733.0,"end":39884.0,"content":"だ"},{"kana":[],"start":39885.0,"end":40036.0,"content":" っ"},{"kana":[],"start":40036.0,"end":40276.0,"content":"て"},{"kana":[{"start":40276.0,"end":40534.0,"content":"お"},{"start":40534.0,"end":40901.0,"content":"と"}],"start":40276.0,"end":40901.0,"content":"音"},{"kana":[],"start":40901.0,"end":41254.0,"content":"を"},{"kana":[{"start":41254.0,"end":42677.0,"content":"あ"}],"start":41254.0,"end":42677.0,"content":"合"},{"kana":[],"start":42677.0,"end":43742.0,"content":"わ"},{"kana":[],"start":43742.0,"end":44652.0,"content":"せ"},{"kana":[],"start":44652.0,"end":44992.0,"content":"た"},{"kana":[],"start":44992.0,"end":45396.0,"content":"ら"}],"verbatim":null},{"time":45630.0,"plain":["友谊的华丽乐章?"],"verbatimK":[{"kana":[],"start":45637.0,"end":45860.0,"content":"キ"},{"kana":[],"start":45860.0,"end":46092.0,"content":"ズ"},{"kana":[],"start":46092.0,"end":46397.0,"content":"ナ"},{"kana":[],"start":46397.0,"end":46748.0,"content":"ミ"},{"kana":[],"start":46749.0,"end":47100.0,"content":"ュ"},{"kana":[],"start":47100.0,"end":47451.0,"content":"ー"},{"kana":[],"start":47452.0,"end":47604.0,"content":"ジ"},{"kana":[],"start":47604.0,"end":47756.0,"content":"ッ"},{"kana":[],"start":47757.0,"end":48132.0,"content":"ク"},{"kana":[{"start":48132.0,"end":48357.0,"content":"お"}],"start":48132.0,"end":48357.0,"content":"?"}],"verbatim":null},{"time":48357.0,"plain":["是我们一心一意 追求的目标"],"verbatimK":[{"kana":[],"start":48357.0,"end":48601.0,"content":"た"},{"kana":[],"start":48601.0,"end":48885.0,"content":"だ"},{"kana":[],"start":48885.0,"end":49167.0,"content":"ひ"},{"kana":[],"start":49167.0,"end":49424.0,"content":"た"},{"kana":[],"start":49424.0,"end":49702.0,"content":"む"},{"kana":[],"start":49702.0,"end":50047.0,"content":"き"},{"kana":[],"start":50047.0,"end":50458.0,"content":"に"},{"kana":[],"start":50458.0,"end":50458.0,"content":" "},{"kana":[],"start":50458.0,"end":50773.0,"content":"追"},{"kana":[],"start":50773.0,"end":51084.0,"content":"い"},{"kana":[],"start":51084.0,"end":51445.0,"content":"か"},{"kana":[],"start":51445.0,"end":52064.0,"content":"け"},{"kana":[],"start":52064.0,"end":52322.0,"content":"て"},{"kana":[],"start":52322.0,"end":52580.0,"content":"い"},{"kana":[],"start":52580.0,"end":53189.0,"content":"た"}],"verbatim":null},{"time":53490.0,"plain":["心底的 思绪 大家一定能察觉"],"verbatimK":[{"kana":[{"start":53494.0,"end":53728.0,"content":"む"},{"start":53728.0,"end":54020.0,"content":"ね"}],"start":53494.0,"end":54020.0,"content":"胸"},{"kana":[],"start":54020.0,"end":54501.0,"content":"の"},{"kana":[{"start":54501.0,"end":54746.0,"content":"お"},{"start":54746.0,"end":55028.0,"content":"く"}],"start":54501.0,"end":55028.0,"content":"奥"},{"kana":[],"start":55028.0,"end":55237.0,"content":"の"},{"kana":[{"start":55237.0,"end":55560.0,"content":"お"},{"start":55560.0,"end":55861.0,"content":"も"}],"start":55237.0,"end":55861.0,"content":"思"},{"kana":[],"start":55861.0,"end":56759.0,"content":"い"},{"kana":[],"start":56759.0,"end":56759.0,"content":" "},{"kana":[{"start":56759.0,"end":57005.0,"content":"き"}],"start":56759.0,"end":57005.0,"content":"気"},{"kana":[],"start":57005.0,"end":57197.0,"content":"づ"},{"kana":[],"start":57197.0,"end":57460.0,"content":"い"},{"kana":[],"start":57460.0,"end":57739.0,"content":"た"},{"kana":[],"start":57739.0,"end":58180.0,"content":"ら"}],"verbatim":null},{"time":58180.0,"plain":["那就一起翻开手中的地图"],"verbatimK":[{"kana":[],"start":58180.0,"end":58424.0,"content":"み"},{"kana":[],"start":58424.0,"end":58668.0,"content":"ん"},{"kana":[],"start":58668.0,"end":58925.0,"content":"な"},{"kana":[],"start":58925.0,"end":59317.0,"content":"で"},{"kana":[],"start":59317.0,"end":59317.0,"content":" "},{"kana":[{"start":59317.0,"end":59572.0,"content":"ち"}],"start":59317.0,"end":59572.0,"content":"地"},{"kana":[{"start":59572.0,"end":59782.0,"content":"ず"}],"start":59572.0,"end":59782.0,"content":"図"},{"kana":[],"start":59782.0,"end":59972.0,"content":"を"},{"kana":[{"start":59972.0,"end":60156.0,"content":"ひ"},{"start":60156.0,"end":60558.0,"content":"ろ"}],"start":59972.0,"end":60558.0,"content":"広"},{"kana":[],"start":60558.0,"end":60837.0,"content":"げ"},{"kana":[],"start":60837.0,"end":61280.0,"content":"て"}],"verbatim":null},{"time":61280.0,"plain":["上路找寻希望 不畏蜿蜒曲折"],"verbatimK":[{"kana":[],"start":61280.0,"end":61529.0,"content":"キ"},{"kana":[],"start":61529.0,"end":61708.0,"content":"ボ"},{"kana":[],"start":61708.0,"end":61887.0,"content":"ウ"},{"kana":[],"start":61888.0,"end":62085.0,"content":"の"},{"kana":[{"start":62085.0,"end":62626.0,"content":"みち"}],"start":62085.0,"end":62626.0,"content":"道"},{"kana":[],"start":62626.0,"end":63101.0,"content":"を"},{"kana":[],"start":63101.0,"end":63101.0,"content":" "},{"kana":[],"start":63101.0,"end":63413.0,"content":" ジ"},{"kana":[],"start":63413.0,"end":63724.0,"content":"グ"},{"kana":[],"start":63724.0,"end":64037.0,"content":"ザ"},{"kana":[],"start":64037.0,"end":64349.0,"content":"グ"},{"kana":[{"start":64349.0,"end":64573.0,"content":"す"},{"start":64573.0,"end":64869.0,"content":"す"}],"start":64349.0,"end":64869.0,"content":"進"},{"kana":[],"start":64869.0,"end":65261.0,"content":"も"},{"kana":[],"start":65261.0,"end":65731.0,"content":"う"}],"verbatim":null},{"time":65731.0,"plain":["友谊的华丽乐章?"],"verbatimK":[{"kana":[],"start":65731.0,"end":66042.0,"content":"キ"},{"kana":[],"start":66042.0,"end":66322.0,"content":"ズ"},{"kana":[],"start":66322.0,"end":66701.0,"content":"ナ"},{"kana":[],"start":66701.0,"end":67044.0,"content":"ミ"},{"kana":[],"start":67044.0,"end":67387.0,"content":"ュ"},{"kana":[],"start":67387.0,"end":67730.0,"content":"ー"},{"kana":[],"start":67730.0,"end":67884.0,"content":"ジ"},{"kana":[],"start":67884.0,"end":68038.0,"content":"ッ"},{"kana":[],"start":68038.0,"end":68335.0,"content":"ク"},{"kana":[{"start":68335.0,"end":68634.0,"content":" だい"}],"start":68335.0,"end":68634.0,"content":"?"}],"verbatim":null},{"time":68634.0,"plain":["是我最爱的歌 约定的歌  永恒的歌"],"verbatimK":[{"kana":[{"start":68634.0,"end":69218.0,"content":"す"}],"start":68634.0,"end":69218.0,"content":"大"},{"kana":[],"start":69218.0,"end":69476.0,"content":"好"},{"kana":[],"start":69476.0,"end":69771.0,"content":"き"},{"kana":[],"start":69771.0,"end":70034.0,"content":"な"},{"kana":[{"start":70034.0,"end":70370.0,"content":"う"},{"start":70370.0,"end":70890.0,"content":"た"}],"start":70034.0,"end":70890.0,"content":"歌"},{"kana":[],"start":70890.0,"end":70890.0,"content":" "},{"kana":[{"start":70890.0,"end":71130.0,"content":"や"},{"start":71130.0,"end":71402.0,"content":"く"}],"start":70890.0,"end":71402.0,"content":"約"},{"kana":[{"start":71402.0,"end":71770.0,"content":"そ"},{"start":71770.0,"end":72354.0,"content":"く"}],"start":71402.0,"end":72354.0,"content":"束"},{"kana":[],"start":72354.0,"end":72642.0,"content":"の"},{"kana":[{"start":72642.0,"end":72954.0,"content":"う"},{"start":72954.0,"end":73656.0,"content":" た"}],"start":72642.0,"end":73656.0,"content":"歌"},{"kana":[],"start":73656.0,"end":73656.0,"content":" "},{"kana":[{"start":73656.0,"end":74309.0,"content":"えい"}],"start":73656.0,"end":74309.0,"content":"永"},{"kana":[{"start":74309.0,"end":74814.0,"content":"えん"}],"start":74309.0,"end":74814.0,"content":"遠"},{"kana":[],"start":74814.0,"end":75080.0,"content":"の"},{"kana":[{"start":75080.0,"end":75418.0,"content":"う"},{"start":75418.0,"end":76071.0,"content":"た"}],"start":75080.0,"end":76071.0,"content":"歌"}],"verbatim":null},{"time":76071.0,"plain":["唱响吧 我们会永远手牵着手"],"verbatimK":[{"kana":[{"start":76071.0,"end":76434.0,"content":"と"},{"start":76434.0,"end":76706.0,"content":"ど"}],"start":76071.0,"end":76706.0,"content":"届"},{"kana":[],"start":76706.0,"end":76993.0,"content":"け"},{"kana":[],"start":76993.0,"end":77228.0,"content":"よ"},{"kana":[],"start":77228.0,"end":77463.0,"content":"う"},{"kana":[],"start":77463.0,"end":77698.0,"content":" "},{"kana":[],"start":77698.0,"end":77922.0,"content":"わ"},{"kana":[],"start":77922.0,"end":78234.0,"content":"た"},{"kana":[],"start":78234.0,"end":78612.0,"content":"し"},{"kana":[],"start":78612.0,"end":78939.0,"content":"た"},{"kana":[],"start":78939.0,"end":79331.0,"content":"ち"},{"kana":[],"start":79331.0,"end":79666.0,"content":"い"},{"kana":[],"start":79666.0,"end":79970.0,"content":"つ"},{"kana":[],"start":79970.0,"end":80218.0,"content":"だ"},{"kana":[],"start":80218.0,"end":80466.0,"content":"っ"},{"kana":[],"start":80466.0,"end":80914.0,"content":"て"}],"verbatim":null},{"time":81200.0,"plain":["尽全力 以恒心致敬梦想"],"verbatimK":[{"kana":[{"start":81202.0,"end":81466.0,"content":"せい"}],"start":81202.0,"end":81466.0,"content":"精"},{"kana":[{"start":81466.0,"end":81754.0,"content":"いっ"}],"start":81466.0,"end":81754.0,"content":"一"},{"kana":[{"start":81754.0,"end":82002.0,"content":"ぱ"},{"start":82002.0,"end":82290.0,"content":"い"}],"start":81754.0,"end":82290.0,"content":"杯"},{"kana":[],"start":82290.0,"end":82290.0,"content":" "},{"kana":[],"start":82290.0,"end":83402.0,"content":"forever "},{"kana":[],"start":83402.0,"end":83799.0,"content":"for "},{"kana":[],"start":83799.0,"end":85098.0,"content":"dreaming"}],"verbatim":null},{"time":85390.0,"plain":["走向梦想的未来"],"verbatimK":[{"kana":[{"start":85395.0,"end":85803.0,"content":"ゆめ"}],"start":85395.0,"end":85803.0,"content":"夢"},{"kana":[],"start":85803.0,"end":86051.0,"content":"の"},{"kana":[{"start":86051.0,"end":86303.0,"content":"む"}],"start":86051.0,"end":86303.0,"content":"向"},{"kana":[],"start":86303.0,"end":86627.0,"content":"こ"},{"kana":[],"start":86628.0,"end":86952.0,"content":"う"},{"kana":[],"start":86952.0,"end":89681.0,"content":"へ"}],"verbatim":null},{"time":96870.0,"plain":["相遇之时的场景 你还记得吗"],"verbatimK":[{"kana":[{"start":96875.0,"end":97167.0,"content":"で"}],"start":96875.0,"end":97167.0,"content":"出"},{"kana":[{"start":97167.0,"end":97288.0,"content":"あ"}],"start":97167.0,"end":97288.0,"content":"会"},{"kana":[],"start":97289.0,"end":97410.0,"content":"っ"},{"kana":[],"start":97410.0,"end":97682.0,"content":"た"},{"kana":[],"start":97682.0,"end":97970.0,"content":"と"},{"kana":[],"start":97970.0,"end":98266.0,"content":"き"},{"kana":[],"start":98266.0,"end":98644.0,"content":"の"},{"kana":[],"start":98644.0,"end":98970.0,"content":"こ"},{"kana":[],"start":98970.0,"end":99293.0,"content":"と"},{"kana":[{"start":99293.0,"end":99594.0,"content":"お"},{"start":99594.0,"end":99874.0,"content":"ぼ"}],"start":99293.0,"end":99874.0,"content":"覚"},{"kana":[],"start":99874.0,"end":100178.0,"content":"え"},{"kana":[],"start":100178.0,"end":100486.0,"content":"て"},{"kana":[],"start":100486.0,"end":100794.0,"content":"い"},{"kana":[],"start":100795.0,"end":101483.0,"content":"る"},{"kana":[],"start":101482.0,"end":101643.0,"content":"?"}],"verbatim":null},{"time":101930.0,"plain":["心中百感交集 梦想交织和鸣"],"verbatimK":[{"kana":[],"start":101938.0,"end":102142.0,"content":"あ"},{"kana":[],"start":102142.0,"end":102341.0,"content":"ふ"},{"kana":[],"start":102341.0,"end":102565.0,"content":"れ"},{"kana":[],"start":102565.0,"end":102790.0,"content":" だ"},{"kana":[],"start":102790.0,"end":103088.0,"content":"す"},{"kana":[{"start":103088.0,"end":103365.0,"content":"お"},{"start":103365.0,"end":103696.0,"content":"も"}],"start":103088.0,"end":103696.0,"content":"思"},{"kana":[],"start":103696.0,"end":104046.0,"content":"い"},{"kana":[],"start":104046.0,"end":104046.0,"content":" "},{"kana":[{"start":104046.0,"end":104669.0,"content":"ひび"}],"start":104046.0,"end":104669.0,"content":"響"},{"kana":[],"start":104669.0,"end":104989.0,"content":"き"},{"kana":[],"start":104989.0,"end":105222.0,"content":"あ"},{"kana":[],"start":105222.0,"end":105489.0,"content":"う"},{"kana":[{"start":105489.0,"end":105821.0,"content":"ゆ"},{"start":105821.0,"end":106629.0,"content":"め"}],"start":105489.0,"end":106629.0,"content":"夢"}],"verbatim":null},{"time":106960.0,"plain":["蓦然回首 彼此都 受到了伤害"],"verbatimK":[{"kana":[{"start":106961.0,"end":107173.0,"content":"き"}],"start":106961.0,"end":107173.0,"content":"気"},{"kana":[],"start":107173.0,"end":107381.0,"content":"づ"},{"kana":[],"start":107381.0,"end":107613.0,"content":"い"},{"kana":[],"start":107613.0,"end":107894.0,"content":"た"},{"kana":[],"start":107894.0,"end":108181.0,"content":"ら"},{"kana":[],"start":108181.0,"end":108181.0,"content":" "},{"kana":[{"start":108181.0,"end":108470.0,"content":"き"},{"start":108470.0,"end":108832.0,"content":"ず"}],"start":108181.0,"end":108832.0,"content":"傷"},{"kana":[],"start":108832.0,"end":109114.0,"content":"つ"},{"kana":[],"start":109114.0,"end":109430.0,"content":"い"},{"kana":[],"start":109430.0,"end":109789.0,"content":"て"},{"kana":[{"start":109789.0,"end":110070.0,"content":"き"},{"start":110070.0,"end":110280.0,"content":"ず"}],"start":109789.0,"end":110280.0,"content":"傷"},{"kana":[],"start":110280.0,"end":110534.0,"content":"つ"},{"kana":[],"start":110534.0,"end":110871.0,"content":"け"},{"kana":[],"start":110871.0,"end":111773.0,"content":"て"}],"verbatim":null},{"time":112060.0,"plain":["可是友谊 也因此而更加深厚"],"verbatimK":[{"kana":[{"start":112061.0,"end":112287.0,"content":"き"},{"start":112287.0,"end":112453.0,"content":"ず"},{"start":112453.0,"end":113045.0,"content":"な"}],"start":112061.0,"end":113045.0,"content":"絆"},{"kana":[],"start":113045.0,"end":113045.0,"content":" "},{"kana":[],"start":113045.0,"end":113239.0,"content":"ま"},{"kana":[],"start":113239.0,"end":113432.0,"content":"た"},{"kana":[{"start":113432.0,"end":113621.0,"content":"ふ"},{"start":113621.0,"end":113963.0,"content":"か"}],"start":113432.0,"end":113963.0,"content":"深"},{"kana":[],"start":113963.0,"end":114248.0,"content":"ま"},{"kana":[],"start":114248.0,"end":114533.0,"content":"っ"},{"kana":[],"start":114533.0,"end":114805.0,"content":"て"},{"kana":[],"start":114805.0,"end":115552.0,"content":"た"}],"verbatim":null},{"time":115890.0,"plain":["只有我们五个人知道的秘密"],"verbatimK":[{"kana":[{"start":115897.0,"end":116289.0,"content":"ご"}],"start":115897.0,"end":116289.0,"content":"五"},{"kana":[{"start":116289.0,"end":117545.0,"content":"にん"}],"start":116289.0,"end":117545.0,"content":"人"},{"kana":[],"start":117545.0,"end":117993.0,"content":"だ"},{"kana":[],"start":117993.0,"end":118417.0,"content":"け"},{"kana":[],"start":118417.0,"end":119697.0,"content":"が"},{"kana":[],"start":119697.0,"end":119697.0,"content":" "},{"kana":[{"start":119697.0,"end":119865.0,"content":"し"}],"start":119697.0,"end":119865.0,"content":"知"},{"kana":[],"start":119865.0,"end":120033.0,"content":"っ"},{"kana":[],"start":120033.0,"end":120249.0,"content":"て"},{"kana":[],"start":120249.0,"end":120465.0,"content":"い"},{"kana":[],"start":120465.0,"end":120694.0,"content":"る"},{"kana":[],"start":120694.0,"end":121017.0,"content":"こ"},{"kana":[],"start":121017.0,"end":122169.0,"content":"と"},{"kana":[],"start":122169.0,"end":122495.0,"content":"た"},{"kana":[],"start":122495.0,"end":122900.0,"content":"ぶ"},{"kana":[],"start":122900.0,"end":123167.0,"content":"ん"}],"verbatim":null},{"time":123490.0,"plain":["似乎总是可以立刻想起"],"verbatimK":[{"kana":[],"start":123494.0,"end":123719.0,"content":"す"},{"kana":[],"start":123719.0,"end":123903.0,"content":"ぐ"},{"kana":[{"start":123903.0,"end":124359.0,"content":"おも"}],"start":123903.0,"end":124359.0,"content":"思"},{"kana":[],"start":124359.0,"end":124679.0,"content":"い"},{"kana":[],"start":124679.0,"end":124983.0,"content":"だ"},{"kana":[],"start":124983.0,"end":125727.0,"content":"す"}],"verbatim":null},{"time":126050.0,"plain":["歌曲会把那一切告诉我"],"verbatimK":[{"kana":[{"start":126056.0,"end":126274.0,"content":"う"},{"start":126274.0,"end":126464.0,"content":"た"}],"start":126056.0,"end":126464.0,"content":"歌"},{"kana":[],"start":126464.0,"end":126691.0,"content":"が"},{"kana":[{"start":126691.0,"end":126896.0,"content":"お"},{"start":126896.0,"end":127224.0,"content":"し"}],"start":126691.0,"end":127224.0,"content":"教"},{"kana":[],"start":127224.0,"end":127551.0,"content":"え"},{"kana":[],"start":127551.0,"end":128921.0,"content":"て"},{"kana":[],"start":128921.0,"end":130152.0,"content":"く"},{"kana":[],"start":130152.0,"end":131048.0,"content":"れ"},{"kana":[],"start":131048.0,"end":131368.0,"content":"る"},{"kana":[],"start":131368.0,"end":131743.0,"content":"よ"}],"verbatim":null},{"time":131980.0,"plain":["友谊的华丽乐章?"],"verbatimK":[{"kana":[],"start":131984.0,"end":132199.0,"content":"キ"},{"kana":[],"start":132199.0,"end":132466.0,"content":"ズ"},{"kana":[],"start":132466.0,"end":132743.0,"content":"ナ"},{"kana":[],"start":132743.0,"end":133049.0,"content":"ミ"},{"kana":[],"start":133050.0,"end":133356.0,"content":"ュ"},{"kana":[],"start":133356.0,"end":133810.0,"content":"ー"},{"kana":[],"start":133811.0,"end":133942.0,"content":"ジ"},{"kana":[],"start":133942.0,"end":134073.0,"content":"ッ"},{"kana":[],"start":134073.0,"end":134466.0,"content":"ク"},{"kana":[{"start":134466.0,"end":134725.0,"content":"はし"}],"start":134466.0,"end":134725.0,"content":"?"}],"verbatim":null},{"time":134725.0,"plain":["渡过那座桥 越过那座山丘"],"verbatimK":[{"kana":[],"start":134725.0,"end":134977.0,"content":"あ"},{"kana":[],"start":134977.0,"end":135273.0,"content":"の"},{"kana":[],"start":135273.0,"end":135772.0,"content":"橋"},{"kana":[{"start":135772.0,"end":136049.0,"content":"わ"},{"start":136049.0,"end":136414.0,"content":"た"}],"start":135772.0,"end":136414.0,"content":"渡"},{"kana":[],"start":136414.0,"end":136825.0,"content":"り"},{"kana":[],"start":136825.0,"end":136825.0,"content":" "},{"kana":[],"start":136825.0,"end":137153.0,"content":"あ"},{"kana":[],"start":137153.0,"end":137409.0,"content":"の"},{"kana":[{"start":137409.0,"end":137722.0,"content":"お"},{"start":137722.0,"end":138347.0,"content":"か"}],"start":137409.0,"end":138347.0,"content":"丘"},{"kana":[],"start":138347.0,"end":138644.0,"content":"を"},{"kana":[{"start":138644.0,"end":138971.0,"content":"こ"}],"start":138644.0,"end":138971.0,"content":"越"},{"kana":[],"start":138971.0,"end":139594.0,"content":"え"}],"verbatim":null},{"time":139840.0,"plain":["翻过那座高墙 你就在那里"],"verbatimK":[{"kana":[],"start":139844.0,"end":140073.0,"content":"そ"},{"kana":[],"start":140073.0,"end":140370.0,"content":"の"},{"kana":[{"start":140370.0,"end":140849.0,"content":"か"},{"start":140849.0,"end":141049.0,"content":"べ"}],"start":140370.0,"end":141049.0,"content":"壁"},{"kana":[],"start":141049.0,"end":141402.0,"content":"を"},{"kana":[{"start":141402.0,"end":141685.0,"content":"こ"}],"start":141402.0,"end":141685.0,"content":"越"},{"kana":[],"start":141685.0,"end":142001.0,"content":"え"},{"kana":[],"start":142001.0,"end":142297.0,"content":"た"},{"kana":[],"start":142297.0,"end":143209.0,"content":"ら"},{"kana":[],"start":143209.0,"end":143209.0,"content":" "},{"kana":[],"start":143209.0,"end":143409.0,"content":"キ"},{"kana":[],"start":143409.0,"end":143641.0,"content":"ミ"},{"kana":[],"start":143641.0,"end":143841.0,"content":"が"},{"kana":[],"start":143841.0,"end":144105.0,"content":"い"},{"kana":[],"start":144105.0,"end":144441.0,"content":"た"}],"verbatim":null},{"time":144441.0,"plain":["终于与你相见"],"verbatimK":[{"kana":[{"start":144441.0,"end":144697.0,"content":"あ"}],"start":144441.0,"end":144697.0,"content":"会"},{"kana":[],"start":144697.0,"end":145025.0,"content":"え"},{"kana":[],"start":145025.0,"end":145297.0,"content":"た"},{"kana":[],"start":145297.0,"end":145697.0,"content":"ね"}],"verbatim":null},{"time":145697.0,"plain":["就算在没有路标的路上 迷失了方向"],"verbatimK":[{"kana":[{"start":145697.0,"end":146041.0,"content":"ひょう"}],"start":145697.0,"end":146041.0,"content":"標"},{"kana":[{"start":146041.0,"end":146481.0,"content":"しき"}],"start":146041.0,"end":146481.0,"content":"識"},{"kana":[],"start":146481.0,"end":146865.0,"content":"の"},{"kana":[],"start":146865.0,"end":147160.0,"content":"な"},{"kana":[],"start":147160.0,"end":147569.0,"content":"い"},{"kana":[{"start":147569.0,"end":147826.0,"content":"ま"},{"start":147826.0,"end":148041.0,"content":"よ"}],"start":147569.0,"end":148041.0,"content":"迷"},{"kana":[],"start":148041.0,"end":148299.0,"content":"い"},{"kana":[],"start":148299.0,"end":148505.0,"content":"の"},{"kana":[{"start":148505.0,"end":148745.0,"content":"み"},{"start":148745.0,"end":149009.0,"content":"ち"}],"start":148505.0,"end":149009.0,"content":"道"},{"kana":[],"start":149009.0,"end":149473.0,"content":"も"}],"verbatim":null},{"time":149473.0,"plain":["只要和你一起 就有前往的信心"],"verbatimK":[{"kana":[],"start":149473.0,"end":149769.0,"content":"キ"},{"kana":[],"start":149769.0,"end":150075.0,"content":"ミ"},{"kana":[],"start":150075.0,"end":150425.0,"content":"と"},{"kana":[],"start":150425.0,"end":150721.0,"content":"な"},{"kana":[],"start":150721.0,"end":150961.0,"content":"ら"},{"kana":[{"start":150961.0,"end":151217.0,"content":"ゆ"}],"start":150961.0,"end":151217.0,"content":"行"},{"kana":[],"start":151217.0,"end":151580.0,"content":"け"},{"kana":[],"start":151580.0,"end":152025.0,"content":"る"}],"verbatim":null},{"time":152025.0,"plain":["友谊的华丽乐章?"],"verbatimK":[{"kana":[],"start":152025.0,"end":152348.0,"content":"キ"},{"kana":[],"start":152348.0,"end":152641.0,"content":"ズ"},{"kana":[],"start":152641.0,"end":153041.0,"content":"ナ"},{"kana":[],"start":153041.0,"end":153409.0,"content":"ミ"},{"kana":[],"start":153409.0,"end":153777.0,"content":"ュ"},{"kana":[],"start":153777.0,"end":154145.0,"content":"ー"},{"kana":[],"start":154145.0,"end":154310.0,"content":"ジ"},{"kana":[],"start":154311.0,"end":154476.0,"content":"ッ"},{"kana":[],"start":154476.0,"end":154761.0,"content":"ク"},{"kana":[],"start":154761.0,"end":155070.0,"content":"?"}],"verbatim":null},{"time":155070.0,"plain":["是我重要的歌 青春的歌 启航的歌"],"verbatimK":[{"kana":[{"start":155070.0,"end":155317.0,"content":"た"},{"start":155317.0,"end":155607.0,"content":"い"}],"start":155070.0,"end":155607.0,"content":"大"},{"kana":[{"start":155607.0,"end":156074.0,"content":"せつ"}],"start":155607.0,"end":156074.0,"content":"切"},{"kana":[],"start":156074.0,"end":156373.0,"content":"な"},{"kana":[{"start":156373.0,"end":156697.0,"content":"う"},{"start":156697.0,"end":157115.0,"content":"た"}],"start":156373.0,"end":157115.0,"content":"歌"},{"kana":[],"start":157115.0,"end":157115.0,"content":" "},{"kana":[{"start":157115.0,"end":157745.0,"content":"せい"}],"start":157115.0,"end":157745.0,"content":"青"},{"kana":[{"start":157745.0,"end":158649.0,"content":"しゅん"}],"start":157745.0,"end":158649.0,"content":"春"},{"kana":[],"start":158649.0,"end":158971.0,"content":"の"},{"kana":[{"start":158971.0,"end":159283.0,"content":"う"},{"start":159283.0,"end":159985.0,"content":"た"}],"start":158971.0,"end":159985.0,"content":"歌"},{"kana":[],"start":159985.0,"end":159985.0,"content":" "},{"kana":[{"start":159985.0,"end":160577.0,"content":"はじ"}],"start":159985.0,"end":160577.0,"content":"始"},{"kana":[],"start":160577.0,"end":160885.0,"content":"ま"},{"kana":[],"start":160885.0,"end":161139.0,"content":"り"},{"kana":[],"start":161139.0,"end":161393.0,"content":"の"},{"kana":[{"start":161393.0,"end":161737.0,"content":"う"},{"start":161737.0,"end":162498.0,"content":"た"}],"start":161393.0,"end":162498.0,"content":"歌"}],"verbatim":null},{"time":162498.0,"plain":["奏响吧 无数次奏响这一曲永恒之歌"],"verbatimK":[{"kana":[{"start":162498.0,"end":162786.0,"content":"か"},{"start":162786.0,"end":163001.0,"content":"な"}],"start":162498.0,"end":163001.0,"content":"奏"},{"kana":[],"start":163001.0,"end":163289.0,"content":"で"},{"kana":[],"start":163289.0,"end":163550.0,"content":"よ"},{"kana":[],"start":163550.0,"end":163811.0,"content":"う"},{"kana":[],"start":163812.0,"end":164073.0,"content":" "},{"kana":[{"start":164073.0,"end":164593.0,"content":"なん"}],"start":164073.0,"end":164593.0,"content":"何"},{"kana":[{"start":164593.0,"end":164944.0,"content":"ど"}],"start":164593.0,"end":164944.0,"content":"度"},{"kana":[],"start":164944.0,"end":165289.0,"content":"で"},{"kana":[],"start":165289.0,"end":165650.0,"content":"も"},{"kana":[],"start":165650.0,"end":165977.0,"content":"い"},{"kana":[],"start":165977.0,"end":166238.0,"content":"つ"},{"kana":[],"start":166238.0,"end":166473.0,"content":"ま"},{"kana":[],"start":166473.0,"end":166764.0,"content":"で"},{"kana":[],"start":166764.0,"end":167166.0,"content":"も"}],"verbatim":null},{"time":167400.0,"plain":["尽全力 以恒心致敬梦想"],"verbatimK":[{"kana":[{"start":167405.0,"end":167644.0,"content":"せい"}],"start":167405.0,"end":167644.0,"content":"精"},{"kana":[{"start":167644.0,"end":167916.0,"content":"いっ"}],"start":167644.0,"end":167916.0,"content":"一"},{"kana":[{"start":167916.0,"end":168197.0,"content":"ぱ"},{"start":168197.0,"end":168636.0,"content":"い"}],"start":167916.0,"end":168636.0,"content":"杯"},{"kana":[],"start":168636.0,"end":168636.0,"content":" "},{"kana":[],"start":168636.0,"end":169812.0,"content":"forever "},{"kana":[],"start":169812.0,"end":170193.0,"content":"for "},{"kana":[],"start":170193.0,"end":171460.0,"content":"dreaming"}],"verbatim":null},{"time":171740.0,"plain":["相信我们的音乐"],"verbatimK":[{"kana":[{"start":171748.0,"end":171963.0,"content":"う"},{"start":171963.0,"end":172149.0,"content":"た"}],"start":171748.0,"end":172149.0,"content":"歌"},{"kana":[],"start":172149.0,"end":172470.0,"content":"を"},{"kana":[{"start":172470.0,"end":172853.0,"content":"しん"}],"start":172470.0,"end":172853.0,"content":"信"},{"kana":[],"start":172853.0,"end":173428.0,"content":"じ"},{"kana":[],"start":173428.0,"end":175968.0,"content":"る"}],"verbatim":null},{"time":216630.0,"plain":["当有一天成为回忆"],"verbatimK":[{"kana":[],"start":216635.0,"end":217331.0,"content":"い"},{"kana":[],"start":217331.0,"end":217611.0,"content":"つ"},{"kana":[],"start":217611.0,"end":218059.0,"content":"か"},{"kana":[],"start":218059.0,"end":218059.0,"content":" "},{"kana":[{"start":218059.0,"end":218371.0,"content":"お"},{"start":218371.0,"end":218643.0,"content":"も"}],"start":218059.0,"end":218643.0,"content":"思"},{"kana":[],"start":218643.0,"end":219068.0,"content":"い"},{"kana":[{"start":219068.0,"end":219971.0,"content":"で"}],"start":219068.0,"end":219971.0,"content":"出"},{"kana":[],"start":219971.0,"end":220203.0,"content":"に"},{"kana":[{"start":220203.0,"end":220515.0,"content":"か"}],"start":220203.0,"end":220515.0,"content":"変"},{"kana":[],"start":220515.0,"end":220731.0,"content":"わ"},{"kana":[],"start":220731.0,"end":220947.0,"content":"っ"},{"kana":[],"start":220947.0,"end":221243.0,"content":"た"},{"kana":[],"start":221243.0,"end":221540.0,"content":"と"},{"kana":[],"start":221540.0,"end":223379.0,"content":"き"}],"verbatim":null},{"time":223810.0,"plain":["再听起这首歌"],"verbatimK":[{"kana":[],"start":223813.0,"end":224027.0,"content":"こ"},{"kana":[],"start":224027.0,"end":224259.0,"content":"の"},{"kana":[{"start":224259.0,"end":225021.0,"content":"う"},{"start":225021.0,"end":225299.0,"content":"た"}],"start":224259.0,"end":225299.0,"content":"歌"},{"kana":[],"start":225299.0,"end":225563.0,"content":"を"},{"kana":[{"start":225563.0,"end":225781.0,"content":"き"}],"start":225563.0,"end":225781.0,"content":"聴"},{"kana":[],"start":225781.0,"end":225999.0,"content":"い"},{"kana":[],"start":225999.0,"end":226237.0,"content":"た"},{"kana":[],"start":226237.0,"end":226548.0,"content":"な"},{"kana":[],"start":226548.0,"end":226835.0,"content":"ら"}],"verbatim":null},{"time":226835.0,"plain":["会是什么感受"],"verbatimK":[{"kana":[],"start":226835.0,"end":227027.0,"content":"ど"},{"kana":[],"start":227028.0,"end":227220.0,"content":"ん"},{"kana":[],"start":227220.0,"end":228675.0,"content":"な"},{"kana":[],"start":228675.0,"end":228891.0,"content":"こ"},{"kana":[],"start":228891.0,"end":229107.0,"content":"と"},{"kana":[],"start":229107.0,"end":229127.0,"content":"を"},{"kana":[{"start":229127.0,"end":229495.0,"content":"かん"}],"start":229127.0,"end":229495.0,"content":"感"},{"kana":[],"start":229495.0,"end":229720.0,"content":"じ"},{"kana":[],"start":229720.0,"end":230079.0,"content":"る"},{"kana":[],"start":230079.0,"end":230327.0,"content":"か"},{"kana":[],"start":230327.0,"end":230842.0,"content":"な"}],"verbatim":null},{"time":231150.0,"plain":["美好 温柔"],"verbatimK":[{"kana":[{"start":231150.0,"end":231552.0,"content":"いと"}],"start":231150.0,"end":231552.0,"content":"愛"},{"kana":[],"start":231552.0,"end":231743.0,"content":"し"},{"kana":[],"start":231743.0,"end":231999.0,"content":"く"},{"kana":[],"start":231999.0,"end":232208.0,"content":"て"},{"kana":[],"start":232208.0,"end":232208.0,"content":" "},{"kana":[{"start":232208.0,"end":232384.0,"content":"や"},{"start":232384.0,"end":232698.0,"content":"さ"}],"start":232208.0,"end":232698.0,"content":"優"},{"kana":[],"start":232698.0,"end":232967.0,"content":"し"},{"kana":[],"start":232967.0,"end":233575.0,"content":"く"}],"verbatim":null},{"time":233840.0,"plain":["开心 难过"],"verbatimK":[{"kana":[{"start":233847.0,"end":234048.0,"content":"う"},{"start":234048.0,"end":234287.0,"content":"れ"}],"start":233847.0,"end":234287.0,"content":"嬉"},{"kana":[],"start":234287.0,"end":234647.0,"content":"し"},{"kana":[],"start":234647.0,"end":234879.0,"content":"く"},{"kana":[],"start":234879.0,"end":235160.0,"content":"て"},{"kana":[],"start":235160.0,"end":235160.0,"content":" "},{"kana":[{"start":235160.0,"end":235408.0,"content":"せ"},{"start":235408.0,"end":235799.0,"content":"つ"}],"start":235160.0,"end":235799.0,"content":"切"},{"kana":[],"start":235799.0,"end":236176.0,"content":"な"},{"kana":[],"start":236176.0,"end":236471.0,"content":" か"},{"kana":[],"start":236471.0,"end":236766.0,"content":"っ"},{"kana":[],"start":236767.0,"end":237519.0,"content":"た"}],"verbatim":null},{"time":237790.0,"plain":["将所有的情感 拥入怀中"],"verbatimK":[{"kana":[{"start":237794.0,"end":238031.0,"content":"お"},{"start":238031.0,"end":238232.0,"content":"も"}],"start":237794.0,"end":238232.0,"content":"思"},{"kana":[],"start":238232.0,"end":238439.0,"content":"い"},{"kana":[],"start":238439.0,"end":238671.0,"content":"す"},{"kana":[],"start":238671.0,"end":238919.0,"content":"べ"},{"kana":[],"start":238919.0,"end":239391.0,"content":"て"},{"kana":[],"start":239391.0,"end":239391.0,"content":" "},{"kana":[{"start":239391.0,"end":240666.0,"content":"だ"}],"start":239391.0,"end":240666.0,"content":"抱"},{"kana":[],"start":240666.0,"end":241851.0,"content":"き"},{"kana":[],"start":241851.0,"end":243167.0,"content":"し"},{"kana":[],"start":243167.0,"end":244524.0,"content":"め"}],"verbatim":null},{"time":244900.0,"plain":["友谊的华丽乐章?"],"verbatimK":[{"kana":[],"start":244907.0,"end":245175.0,"content":"キ"},{"kana":[],"start":245175.0,"end":245468.0,"content":"ズ"},{"kana":[],"start":245468.0,"end":245751.0,"content":"ナ"},{"kana":[],"start":245751.0,"end":246132.0,"content":"ミ"},{"kana":[],"start":246133.0,"end":246514.0,"content":"ュ"},{"kana":[],"start":246514.0,"end":246895.0,"content":"ー"},{"kana":[],"start":246896.0,"end":247056.0,"content":"ジ"},{"kana":[],"start":247056.0,"end":247216.0,"content":"ッ"},{"kana":[],"start":247217.0,"end":247513.0,"content":"ク"},{"kana":[],"start":247513.0,"end":247784.0,"content":"?"}],"verbatim":null},{"time":247784.0,"plain":["颤动我的心弦 带给我无限勇气"],"verbatimK":[{"kana":[{"start":247784.0,"end":247991.0,"content":"こ"},{"start":247991.0,"end":248290.0,"content":"こ"},{"start":248290.0,"end":248547.0,"content":"ろ"}],"start":247784.0,"end":248547.0,"content":"心"},{"kana":[{"start":248547.0,"end":248800.0,"content":"ふ"},{"start":248800.0,"end":249074.0,"content":"る"}],"start":248547.0,"end":249074.0,"content":"震"},{"kana":[],"start":249074.0,"end":249440.0,"content":"え"},{"kana":[],"start":249440.0,"end":249935.0,"content":"て"},{"kana":[],"start":249935.0,"end":249935.0,"content":" "},{"kana":[{"start":249935.0,"end":250433.0,"content":"ゆう"}],"start":249935.0,"end":250433.0,"content":"勇"},{"kana":[{"start":250433.0,"end":250824.0,"content":"き"}],"start":250433.0,"end":250824.0,"content":"気"},{"kana":[],"start":250824.0,"end":251408.0,"content":"あ"},{"kana":[],"start":251408.0,"end":251692.0,"content":"ふ"},{"kana":[],"start":251692.0,"end":251975.0,"content":"れ"},{"kana":[],"start":251975.0,"end":252731.0,"content":"て"}],"verbatim":null},{"time":252731.0,"plain":["不禁热泪盈眶"],"verbatimK":[{"kana":[{"start":252731.0,"end":253008.0,"content":"な"},{"start":253008.0,"end":253314.0,"content":"み"},{"start":253314.0,"end":253840.0,"content":"だ"}],"start":252731.0,"end":253840.0,"content":"涙"},{"kana":[],"start":253840.0,"end":254071.0,"content":"が"},{"kana":[],"start":254071.0,"end":254439.0,"content":"で"},{"kana":[],"start":254439.0,"end":254535.0,"content":"ち"},{"kana":[],"start":254535.0,"end":254631.0,"content":"ゃ"},{"kana":[],"start":254631.0,"end":255039.0,"content":"い"},{"kana":[],"start":255039.0,"end":255636.0,"content":"そ"},{"kana":[],"start":255636.0,"end":256187.0,"content":"う"},{"kana":[{"start":256187.0,"end":256459.0,"content":"う"},{"start":256459.0,"end":256804.0,"content":"た"}],"start":256187.0,"end":256804.0,"content":"歌"},{"kana":[],"start":256804.0,"end":256935.0,"content":"お"},{"kana":[],"start":256935.0,"end":257129.0,"content":"う"},{"kana":[],"start":257130.0,"end":257467.0,"content":"よ"}],"verbatim":null},{"time":257550.0,"plain":["大家一起 放声唱响"],"verbatimK":[{"kana":[],"start":257554.0,"end":257818.0,"content":"み"},{"kana":[],"start":257818.0,"end":258082.0,"content":"ん"},{"kana":[],"start":258082.0,"end":258346.0,"content":"な"},{"kana":[],"start":258346.0,"end":258722.0,"content":"で"},{"kana":[],"start":258722.0,"end":258722.0,"content":" "},{"kana":[{"start":258722.0,"end":258994.0,"content":"こ"},{"start":258994.0,"end":259209.0,"content":"え"}],"start":258722.0,"end":259209.0,"content":"声"},{"kana":[{"start":259209.0,"end":259716.0,"content":"たか"}],"start":259209.0,"end":259716.0,"content":"高"},{"kana":[],"start":259716.0,"end":260005.0,"content":"ら"},{"kana":[],"start":260005.0,"end":260290.0,"content":"か"},{"kana":[],"start":260290.0,"end":260674.0,"content":"に"}],"verbatim":null},{"time":260674.0,"plain":["这一首明天的歌 献给未来的歌"],"verbatimK":[{"kana":[{"start":260674.0,"end":260890.0,"content":"あ"},{"start":260890.0,"end":261102.0,"content":"し"},{"start":261102.0,"end":261289.0,"content":"た"}],"start":260674.0,"end":261289.0,"content":"明日"},{"kana":[],"start":261289.0,"end":261478.0,"content":"の"},{"kana":[{"start":261478.0,"end":261981.0,"content":"うた"}],"start":261478.0,"end":261981.0,"content":"歌"},{"kana":[],"start":261981.0,"end":262484.0,"content":"を"},{"kana":[],"start":262484.0,"end":262484.0,"content":" "},{"kana":[{"start":262484.0,"end":262765.0,"content":"み"}],"start":262484.0,"end":262765.0,"content":"未"},{"kana":[{"start":262765.0,"end":263050.0,"content":"ら"},{"start":263050.0,"end":263402.0,"content":"い"}],"start":262765.0,"end":263402.0,"content":"来"},{"kana":[],"start":263402.0,"end":263730.0,"content":"へ"},{"kana":[],"start":263730.0,"end":263954.0,"content":"の"},{"kana":[{"start":263954.0,"end":264186.0,"content":"う"},{"start":264186.0,"end":264514.0,"content":"た"}],"start":263954.0,"end":264514.0,"content":"歌"},{"kana":[],"start":264514.0,"end":265070.0,"content":"を"}],"verbatim":null},{"time":265370.0,"plain":["如此的"],"verbatimK":[{"kana":[],"start":265370.0,"end":265498.0,"content":"そ"},{"kana":[],"start":265498.0,"end":265626.0,"content":"ん"},{"kana":[],"start":265626.0,"end":267499.0,"content":"な"}],"verbatim":null},{"time":268710.0,"plain":["华丽乐章?"],"verbatimK":[{"kana":[],"start":268714.0,"end":269018.0,"content":"ミ"},{"kana":[],"start":269018.0,"end":269322.0,"content":"ュ"},{"kana":[],"start":269322.0,"end":269626.0,"content":"ー"},{"kana":[],"start":269626.0,"end":269830.0,"content":"ジ"},{"kana":[],"start":269830.0,"end":270034.0,"content":"ッ"},{"kana":[],"start":270034.0,"end":270325.0,"content":"ク"},{"kana":[],"start":270325.0,"end":270571.0,"content":"?"}],"verbatim":null},{"time":270571.0,"plain":["是我最爱的歌  约定的歌 永恒的歌"],"verbatimK":[{"kana":[{"start":270571.0,"end":270800.0,"content":"だ"},{"start":270800.0,"end":271066.0,"content":"い"}],"start":270571.0,"end":271066.0,"content":"大"},{"kana":[{"start":271066.0,"end":271314.0,"content":"す"}],"start":271066.0,"end":271314.0,"content":"好"},{"kana":[],"start":271314.0,"end":271554.0,"content":"き"},{"kana":[],"start":271554.0,"end":271810.0,"content":"な"},{"kana":[{"start":271810.0,"end":272163.0,"content":"う"},{"start":272163.0,"end":272634.0,"content":"た"}],"start":271810.0,"end":272634.0,"content":"歌"},{"kana":[],"start":272634.0,"end":272634.0,"content":" "},{"kana":[{"start":272634.0,"end":273247.0,"content":"やく"}],"start":272634.0,"end":273247.0,"content":"約"},{"kana":[{"start":273247.0,"end":273618.0,"content":"そ"},{"start":273618.0,"end":274186.0,"content":" く"}],"start":273247.0,"end":274186.0,"content":"束"},{"kana":[],"start":274186.0,"end":274497.0,"content":"の"},{"kana":[{"start":274497.0,"end":274794.0,"content":"う"},{"start":274794.0,"end":275554.0,"content":"た"}],"start":274497.0,"end":275554.0,"content":"歌"},{"kana":[],"start":275554.0,"end":275554.0,"content":" "},{"kana":[{"start":275554.0,"end":276174.0,"content":"えい"}],"start":275554.0,"end":276174.0,"content":"永"},{"kana":[{"start":276174.0,"end":276658.0,"content":"えん"}],"start":276174.0,"end":276658.0,"content":"遠"},{"kana":[],"start":276658.0,"end":276938.0,"content":" の"},{"kana":[{"start":276938.0,"end":277269.0,"content":"う"},{"start":277269.0,"end":277994.0,"content":"た"}],"start":276938.0,"end":277994.0,"content":"歌"}],"verbatim":null},{"time":277994.0,"plain":["唱响吧 我们会永远手牵着手"],"verbatimK":[{"kana":[{"start":277994.0,"end":278290.0,"content":"と"},{"start":278290.0,"end":278518.0,"content":"ど"}],"start":277994.0,"end":278518.0,"content":"届"},{"kana":[],"start":278518.0,"end":278810.0,"content":"け"},{"kana":[],"start":278810.0,"end":279045.0,"content":"よ"},{"kana":[],"start":279045.0,"end":279280.0,"content":"う"},{"kana":[],"start":279281.0,"end":279516.0,"content":" "},{"kana":[],"start":279516.0,"end":279803.0,"content":"わ"},{"kana":[],"start":279803.0,"end":280142.0,"content":"た"},{"kana":[],"start":280142.0,"end":280493.0,"content":"し"},{"kana":[],"start":280493.0,"end":280805.0,"content":"た"},{"kana":[],"start":280805.0,"end":281227.0,"content":"ち"},{"kana":[],"start":281227.0,"end":281492.0,"content":"い"},{"kana":[],"start":281492.0,"end":281772.0,"content":"つ"},{"kana":[],"start":281772.0,"end":282069.0,"content":"だ"},{"kana":[],"start":282069.0,"end":282366.0,"content":"っ"},{"kana":[],"start":282366.0,"end":282828.0,"content":"て"}],"verbatim":null},{"time":282828.0,"plain":["尽全力 以恒心致敬梦想"],"verbatimK":[{"kana":[{"start":282828.0,"end":283164.0,"content":"せい"}],"start":282828.0,"end":283164.0,"content":"精"},{"kana":[{"start":283164.0,"end":283437.0,"content":"いっ"}],"start":283164.0,"end":283437.0,"content":"一"},{"kana":[{"start":283437.0,"end":283716.0,"content":"ぱ"},{"start":283716.0,"end":284164.0,"content":"い"}],"start":283437.0,"end":284164.0,"content":" 杯"},{"kana":[],"start":284164.0,"end":284164.0,"content":" "},{"kana":[],"start":284164.0,"end":285324.0,"content":"forever "},{"kana":[],"start":285324.0,"end":285688.0,"content":"for "},{"kana":[],"start":285688.0,"end":286514.0,"content":"dreaming"}],"verbatim":null},{"time":286790.0,"plain":["我永远与你同在"],"verbatimK":[{"kana":[],"start":286791.0,"end":287047.0,"content":"キ"},{"kana":[],"start":287047.0,"end":287315.0,"content":"ミ"},{"kana":[],"start":287315.0,"end":287644.0,"content":"と"},{"kana":[{"start":287644.0,"end":288247.0,"content":"いっ"}],"start":287644.0,"end":288247.0,"content":"一"},{"kana":[{"start":288247.0,"end":288559.0,"content":"しょ"}],"start":288247.0,"end":288559.0,"content":" 緒"},{"kana":[],"start":288559.0,"end":288879.0,"content":"だ"},{"kana":[],"start":288879.0,"end":289291.0,"content":"よ"}],"verbatim":null},{"time":289580.0,"plain":["以恒心致敬梦想"],"verbatimK":[{"kana":[],"start":289583.0,"end":290451.0,"content":"Forever "},{"kana":[],"start":290451.0,"end":290787.0,"content":"for "},{"kana":[],"start":290787.0,"end":292075.0,"content":"dreaming"}],"verbatim":null},{"time":292400.0,"plain":["我永远相信着你"],"verbatimK":[{"kana":[],"start":292404.0,"end":292595.0,"content":"キ"},{"kana":[],"start":292595.0,"end":292804.0,"content":"ミ"},{"kana":[],"start":292804.0,"end":293099.0,"content":"を"},{"kana":[{"start":293099.0,"end":293643.0,"content":"しん"}],"start":293099.0,"end":293643.0,"content":"信"},{"kana":[],"start":293643.0,"end":293973.0,"content":"じ"},{"kana":[],"start":293973.0,"end":296718.0,"content":"る"}],"verbatim":null}])

// //歌词颜色
// const lyric_color = ref<string>('rgb(28, 178, 255)')

//格式化时间
const formatTime = (seconds : number) => {
  let min = Math.floor(seconds / 60)
  let sec = Math.floor(seconds % 60)
  return `${min}:${sec < 10 ? '0' + sec : sec}`
}

//当前歌词行
const active_lyric = ref<number>(0)

const updateActiveLyric = () => {
  if (lyrics.value.length == 0) return

  let active : number = 0
  
  let value = current.value * total.value * 1000
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

//计算当前歌词偏移
const getLyricTranslation = () : number => {
  let offset = (panel_main.value?.offsetHeight / 2) || 0

  let active = document.getElementsByClassName('player-lyric-line-active')
  if (active.length > 0 && active[0]) {
    offset -= (<HTMLElement> active[0]).offsetTop
    offset -= (<HTMLElement> active[0]).offsetHeight / 2
  }

  return offset
}

const generateVerbatimStyle = (background : string) => {
  return {
    background,
    '-webkit-background-clip': 'text',
    'background-clip': 'text'
  }
}

//计算逐字背景
const calcVerbatimBackground = (v : VerbatimLyric | Kana, index : number) => {
  if (index != active_lyric.value) return generateVerbatimStyle('var(--player-lyric-line-color)')

  let value = total.value * current.value * 1000

  if (value >= v.end) {
    return generateVerbatimStyle('linear-gradient(to right, var(--player-lyric-read) 0%, var(--player-lyric-read) 100%)')
  }
  if (value < v.start || v.start == v.end) {
    return generateVerbatimStyle('linear-gradient(to right, var(--player-lyric-unread) 0%, var(--player-lyric-unread) 100%)')
  }

  let rate = (value - v.start) / (v.end - v.start) * 100
  return generateVerbatimStyle(`linear-gradient(to right, var(--player-lyric-read) 0%, var(--player-lyric-read) ${rate}%, var(--player-lyric-unread) ${rate}%, var(--player-lyric-unread) 100%)`)
}

const setTitle = (t : string) => title.value = t

const setArtist = (a : string) => artist.value = a

const setAlbum = (a : string) => album.value = a

const setPlaying = (p : boolean) => {
  playing.value = p
  if (!intervalState.value && p)
    intervalState.value = setInterval(updateProgress, 10)
}

const setCurrent = (c : number) => {
  current.value = Math.abs((c - current.value) * total.value) < 0.5 ? Math.max(c, current.value) : c
  updateActiveLyric()

  anchor_lock.acquire().then((release) => {
    anchor_pos.value = current.value
    anchor_time.value = Date.now()
    release()
  })
}

const setTotal = (t : number) => total.value = t

const setRate = (r : number) => rate.value = r

const setLyric = (lrc : Array<LyricLine>) => {
  lyrics.value = lrc
  updateActiveLyric()
}

const setLyricColor = (r : number, g : number, b : number) => lyric_color.value = `rgb(${r}, ${g}, ${b})`

const pull_cnt = ref<number>(0)

//进度状态控制
const updateProgress = () => {
  pull_cnt.value = (++pull_cnt.value) % 300
  if (pull_cnt.value == 0) {
    //拉取状态更新
    try {
      easy_k.queryState()
    } catch {
    }
  }
  
  //更新锚点
  anchor_lock.acquire().then((release) => {
    if (playing.value) {
      let offset = (Date.now() - anchor_time.value) * rate.value / 1000

      if (offset <= total.value) {
        current.value = offset / total.value + anchor_pos.value
        updateActiveLyric()
      }
    } else {
      anchor_time.value = Date.now()
    }

    release()
  })

  //退出机制
  if (current.value >= 1) {
    playing.value = false
    clearInterval(intervalState.value)
    intervalState.value = undefined
  }
}

onMounted(() => {
  //暴露方法到外部
  window['setTitle'] = setTitle
  window['setArtist'] = setArtist
  window['setAlbum'] = setAlbum
  window['setPlaying'] = setPlaying
  window['setCurrent'] = setCurrent
  window['setRate'] = setRate
  window['setTotal'] = setTotal
  window['setLyric'] = setLyric
  window['setLyricColor'] = setLyricColor

  //初始化进度锚点
  anchor_time.value = Date.now()

  //启动进度拉取定时器
  intervalState.value = setInterval(updateProgress, 10)
})

</script>

<style scoped>

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

  --player-lyric-unread: rgba(255, 255, 255, 0.5);
}

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

.player-panel {
  display: flex;
  position: relative;
  --player-lyrics-width: 40vw;
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

  --player-lyric-line-color: #fff;
  --player-lyric-line-padding: 2.5vh;
  --player-lyric-line-height-rate: 1.5;
  --player-lyric-font-size-mini-rate: 0.9;
  --player-lyric-font-size: max(1.5rem, 3.2vh);
  --player-lyric-kana-font-size: max(1.2rem, 2.56vh);
  --player-lyric-kana-line-height-rate: 1.0;
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
  color: var(--player-lyric-line-color);
  opacity: 0.4;
  transition: all 0.2s ease;
  font-size: var(--player-lyric-font-size);
  transform: scale(var(--player-lyric-font-size-mini-rate));
}

.player-lyric-line-active {
  opacity: 1;
  text-shadow:
    max(-1px, -0.13vh) max(-1px, -0.13vh) 0 rgba(0, 0, 0, 0.1),  
    min(1px, 0.13vh) max(-1px, -0.13vh) 0 rgba(0, 0, 0, 0.1),
    max(-1px, -0.13vh) min(1px, 0.13vh) 0 rgba(0, 0, 0, 0.1),
    min(1px, 0.13vh) min(1px, 0.13vh) 0 rgba(0, 0, 0, 0.1);
  transform: scale(1);
}

.player-lyric-text {
  line-height: var(--player-lyric-line-height-rate);
  transition: all 0.2s ease;
}

.player-lyric-inline {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}

.player-lyric-wrapper {
  flex-flow: row wrap;
}

.player-lyric-verbatim {
  color: transparent;
  -webkit-text-fill-color: transparent;
  text-shadow: none;
}

.player-lyric-roma {
  margin: 0 max(0.26vh, 0.125rem);
}

.player-lyric-verbatim-main {
  margin: 0 max(0.26vh, 0.125rem);
}

.player-lyric-verbatim-kana {
  font-weight: bold;
  align-items: end;
}

.player-lyric-kana {
  font-size: var(--player-lyric-kana-font-size);
  line-height: var(--player-lyric-kana-line-height-rate);
}

</style>
