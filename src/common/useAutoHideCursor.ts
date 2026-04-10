// composables/useAutoHideCursor.ts
import { ref, onMounted, onUnmounted, type Ref } from 'vue'
interface AutoHideReturn {
    /** 绑定到目标元素的 ref */
    targetRef: Ref<HTMLElement | null>
    /** 当前是否隐藏鼠标 */
    isHidden: Ref<boolean>
    /** 手动显示鼠标 */
    show: () => void
    /** 手动隐藏鼠标 */
    hide: () => void
    /** 重置计时器 */
    reset: () => void
}

export function useAutoHideCursor(delay : number = 3000): AutoHideReturn {
    const targetRef = ref<HTMLElement | null>(null)
    const isHidden = ref(false)
    
    let hideTimer: number | null = null

    const show = () => {
        isHidden.value = false
    }

    const hide = () => {
        isHidden.value = true
    }

    const startHideTimer = () => {
        if (hideTimer) clearTimeout(hideTimer)
        hideTimer = window.setTimeout(() => {
            hide()
            hideTimer = null
        }, delay)
    }

    const reset = () => {
        show()
        startHideTimer()
    }

    onMounted(() => {
        const el = targetRef.value
        if (!el) return

        el.addEventListener('mousemove', reset)
        el.addEventListener('click', reset)
    })

    onUnmounted(() => {
        const el = targetRef.value
        if (!el) return

        el.removeEventListener('mousemove', reset)
        el.removeEventListener('click', reset)
        
        if (hideTimer) clearTimeout(hideTimer)
    })

    return {
        targetRef,
        isHidden,
        show,
        hide,
        reset
    }
}