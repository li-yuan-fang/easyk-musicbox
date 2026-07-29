<template>
    <!-- 主容器 -->
    <div
        ref="targetRef"
        class="player-container player-instance"
        :style="{
            backgroundColor: `rgba(0, 0, 0, ${background_alpha})`,
            cursor: isHidden ? 'none !important' : 'auto'
        }"
    >

        <div class="player-panel">
            <!-- 主面板 -->
            <div
                class="player-panel-main"
                ref="panel_main"
                :style="{ maxWidth: lyric_valid() ? '20vw' : 'unset' }"
            >
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
                                v-if="attribute.album && attribute.album?.length > 0"
                                class="player-album"
                                :src="attribute.album"
                            >
                        </div>
                    </div>
                </div>

                <div class="player-title-container">
                    <h2 class="player-title player-word-break">{{ attribute.title }}</h2>
                    <p class="player-artist player-word-break">{{ attribute.artist }}</p>
                </div>

                <div class="player-progress-container">
                    <span class="player-progress-current">{{ formatTime(current * attribute.total) }}</span>
                    <input
                        class="player-progress-bar"
                        :value="Math.round(current * 1000)"
                        type="range"
                        min="0"
                        max="1000"
                        :style="{ backgroundSize: `${(current * 100).toFixed(1)}% 100%` }"
                    />
                    <span class="player-progress-total">{{ formatTime(attribute.total) }}</span>
                </div>
            </div>

            <!-- 歌词面板 -->
            <div class="player-panel-lyrics-space" v-if="lyric_valid()" />
            <div class="player-panel-lyrics" v-if="lyric_valid()">
                <div
                    class="player-lyrics-wrapper"
                    :style="{
                        transform: `translateY(${lyric_translation}px)`,
                        '--player-lyric-read': lyric_color
                    }"
                >

                    <!-- 歌词行 -->
                    <div
                        v-for="(line, index) in lyrics" 
                        :key="index"
                        :class="{ 
                            'player-lyric-line-active': index === active_lyric
                        }"
                        class="player-lyric-line"
                        :style="{
                            paddingTop: (lyric_intersect && index === active_lyric + 1) ? '0' : '',
                            paddingBottom: (lyric_intersect && index === active_lyric) ? '0' : ''
                        }"
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
                                <div class="player-lyric-inline">
                                    <div
                                        v-for="(text, c) in (vk.text || [])"
                                        :key="c"
                                        class="player-lyric-verbatim"
                                        :style="calcVerbatimBackground(text, index)"
                                    >
                                        {{ text.content }}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 逐字行 -->
                        <div class="player-lyric-wrapper player-lyric-inline player-lyric-text">
                            <div
                                v-for="(v, j) in (line.verbatim || [])"
                                :key="j"
                                class="player-lyric-roma player-lyric-verbatim"
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
            v-if="attribute.album && attribute.album?.length > 0"
            class="player-background-album"
            :style="{ backgroundImage: `url(${attribute.album})` }"
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
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import type { LyricLine, MusicAttribute, VerbatimLyricBase } from './common/types';
import { Mutex } from 'async-mutex';
import { useAutoHideCursor } from './common/useAutoHideCursor';

const current_sync_time : number = 300

const panel_main = ref()

const attribute = ref<MusicAttribute>({
    title: '',
    artist: '',
    total: 0
})

//播放状态
const playing = ref<boolean>(false)
//播放进度(0-1)
const current = ref<number>(0)
//播放速度
const rate = ref<number>(1.0)

//进度锚点锁
const anchor_lock = new Mutex()
//进度锚点(0-1)
const anchor_pos = ref<number>(0)
//进度锚点时间戳(单位:ms)
const anchor_time = ref<number>(0)

//鼠标自动隐藏
const { targetRef, isHidden } = useAutoHideCursor(2000)

//歌词
const lyrics = ref<Array<LyricLine>>([])
//歌词偏移
const lyric_offset = ref<number>(0)
//歌词颜色
const lyric_color = ref<string>('#fff')
//当前歌词偏移
const lyric_translation = ref<number>(0)
//背景遮罩透明度
const background_alpha = ref<number>(0.2)
//K歌模式(双层歌词)
const lyric_intersect = ref<boolean>(false)

//渲染回调ID
const render_id = ref<number>(-1)

const lyric_valid = () : boolean => lyrics.value.length > 0

//歌词进度(单位:ms)
const lyric_current = computed(() => current.value * attribute.value.total * 1000 + lyric_offset.value)

//格式化时间
const formatTime = (seconds : number) => {
    let min = Math.floor(seconds / 60)
    let sec = Math.floor(seconds % 60)
    return `${min}:${sec < 10 ? '0' + sec : sec}`
}

//当前歌词行
const active_lyric = ref<number>(0)

const calcActiveLyric = (start : number) : number => {
    let active : number = start
    for (let i = start; i < lyrics.value.length; i++) {
        if (lyric_current.value >= lyrics.value[i].time) {
            active = i
        } else {
            break
        }
    }

    return active
}

const updateActiveLyric = () => {
    if (lyrics.value.length == 0) return

    let active : number = 0
    
    if (lyric_current.value >= lyrics.value[active_lyric.value].time) {
        //进度正常推进
        active = calcActiveLyric(active_lyric.value)
    } else {
        //进度被往前调整
        active = calcActiveLyric(0)
    }

    if (active < lyrics.value.length - 1) {
        //对逐字歌词尽可能歌词提前(基本逐字行和复杂逐字单元分开处理)
        if (lyrics.value[active]?.verbatimK) {
            //复杂逐字单元
            let v = lyrics.value[active]?.verbatimK
            if (v) {
                let last_unit = v.slice(-1)[0]
                if (last_unit) {
                    let last_text = last_unit.text.slice(-1)[0]
                    if (last_text && lyric_current.value >= last_text.end) active++
                }
            }
        } else if (lyrics.value[active]?.verbatim) {
            //基本逐字行
            let v = lyrics.value[active]?.verbatim
            if (v) {
                let last = v.slice(-1)[0]
                if (last && lyric_current.value >= last.end) active++
            }
        }
    }

    active_lyric.value = active
}

//计算当前歌词偏移
const calcLyricTranslation = () : number => {
    let offset = (panel_main.value?.offsetHeight / 2) || 0

    let active = document.getElementsByClassName('player-lyric-line-active')
    if (active.length > 0 && active[0]) {
        offset -= (<HTMLElement> active[0]).offsetTop

        if (lyric_intersect.value) {
            offset -= (<HTMLElement> active[0]).offsetHeight

            if (panel_main.value && (<HTMLElement> active[0]).offsetHeight > (panel_main.value.offsetHeight * 0.4)) {
                offset += (<HTMLElement> active[0]).offsetHeight - (panel_main.value.offsetHeight * 0.4)
            }
        } else {
            offset -= (<HTMLElement> active[0]).offsetHeight / 2
        }
    }

    return offset
}

//等待DOM渲染后再计算正确的translation
const updateLyricTranslation = async () => {
    await nextTick()
    lyric_translation.value = calcLyricTranslation()
}

watch(
    [active_lyric, lyric_intersect, lyrics],
    updateLyricTranslation,
    {
        flush: 'post',
        immediate: true
    }
)

const generateVerbatimStyle = (background : string) => {
    return {
        background,
        '-webkit-background-clip': 'text',
        'background-clip': 'text'
    }
}

//计算逐字背景
const calcVerbatimBackground = (v : VerbatimLyricBase, index : number) => {
    if (index != active_lyric.value) return generateVerbatimStyle('var(--player-lyric-line-color)')

    if (lyric_current.value >= v.end) {
        return generateVerbatimStyle('linear-gradient(to right, var(--player-lyric-read) 0%, var(--player-lyric-read) 100%)')
    }
    if (lyric_current.value < v.start || v.start == v.end) {
        return generateVerbatimStyle('linear-gradient(to right, var(--player-lyric-unread) 0%, var(--player-lyric-unread) 100%)')
    }

    let rate = (lyric_current.value - v.start) / (v.end - v.start) * 100
    return generateVerbatimStyle(`linear-gradient(to right, var(--player-lyric-read) 0%, var(--player-lyric-read) ${rate}%, var(--player-lyric-unread) ${rate}%, var(--player-lyric-unread) 100%)`)
}

const setAttribute = (a : MusicAttribute) => attribute.value = a

const setPlaying = (p : boolean) => {
    playing.value = p
}

const setCurrent = (c : number) => {
    current.value = Math.abs((c - current.value) * attribute.value.total) < 0.5 ? Math.max(c, current.value) : c
    updateActiveLyric()

    anchor_lock.acquire().then((release) => {
        anchor_pos.value = current.value
        anchor_time.value = Date.now()
        release()
    })
}

const setRate = (r : number) => rate.value = r

const setLyric = (lrc : Array<LyricLine>) => {
    lyrics.value = lrc
    updateActiveLyric()
}

const setLyricColor = (r : number, g : number, b : number, a : number) => {
    lyric_color.value = `rgb(${r}, ${g}, ${b})`
    background_alpha.value = a
}

const setLyricIntersectMode = (i : boolean) => lyric_intersect.value = i

const setOffset = (o : number) => {
    lyric_offset.value = o
}

const pull_cnt = ref<number>(0)

//进度状态控制
const updateProgress = () => {
    pull_cnt.value = (++pull_cnt.value) % current_sync_time
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

            if (offset <= attribute.value.total) {
                current.value = offset / attribute.value.total + anchor_pos.value
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

        cancelAnimationFrame(render_id.value)
        render_id.value = -1
    }
}

const render = () => {
    updateProgress()
    render_id.value = requestAnimationFrame(render)
}

onMounted(() => {
    //暴露方法到外部
    window['setAttribute'] = setAttribute
    window['setPlaying'] = setPlaying
    window['setCurrent'] = setCurrent
    window['setRate'] = setRate
    window['setLyric'] = setLyric
    window['setLyricColor'] = setLyricColor
    window['setLyricIntersectMode'] = setLyricIntersectMode
    window['setOffset'] = setOffset

    //初始化进度锚点
    anchor_time.value = Date.now()

    //开始请求渲染回调
    render_id.value = requestAnimationFrame(render)

    //发起首次同步请求
    setTimeout(() => {
        //拉取状态更新
        try {
            easy_k.queryState()
        } catch {
        }
    }, 100)
})

onUnmounted(() => {
    if (render_id.value >= 0) cancelAnimationFrame(render_id.value)
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

.player-word-break {
    overflow-wrap: anywhere;
    word-break: normal;
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
        black 15%,
        black 85%,
        transparent 100%
    );
    -webkit-mask-image: linear-gradient(
        to bottom,
        transparent 0%,
        black 15%,
        black 85%,
        transparent 100%
    );

    --player-lyric-line-color: #fff;
    --player-lyric-line-padding: 2.5vh;
    --player-lyric-line-height-rate: 1.5;
    --player-lyric-font-size-mini-rate: 0.9;
    --player-lyric-font-size: max(1.4rem, 3.0vh);
    --player-lyric-verbatim-font-size: max(1.75rem, 3.6vh);
    --player-lyric-verbatim-line-height-rate: 1.5;
    --player-lyric-kana-font-size: max(1.4rem, 3.0vh);
    --player-lyric-kana-line-height-rate: 1.0;
    --player-lyric-roma-font-size: max(1.3rem, 2.8vh);
    --player-lyric-roma-line-height-rate: 1.25;
}


.player-panel-lyrics-space {
    display: block;
    width: calc(var(--player-lyrics-width) + 15vh);
    height: 100%;
}

.player-lyrics-wrapper {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform;
}

/* 歌词行 */
.player-lyric-line {
    padding: var(--player-lyric-line-padding) 0;
    text-align: center;
    color: var(--player-lyric-line-color);
    opacity: 0.4;
    transition: 
        opacity 0.2s ease,
        transform 0.2s ease,
        text-shadow 0.2s ease;
    will-change: opacity, transform;
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
    font-weight: 600;
    margin: 0 max(0.26vh, 0.125rem);
    font-size: var(--player-lyric-roma-font-size);
    line-height: var(--player-lyric-roma-line-height-rate);
}

.player-lyric-verbatim-main {
    font-size: var(--player-lyric-verbatim-font-size);
    line-height: var(--player-lyric-verbatim-line-height-rate);
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
