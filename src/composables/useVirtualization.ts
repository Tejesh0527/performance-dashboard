import { ref, computed } from 'vue'

export interface VirtualRange {
  startIndex:  number
  endIndex:    number
  offsetTop:   number   // px — top padding to simulate scrolled-away rows
  totalHeight: number   // px — total list height for scroll container
}

export function useVirtualization(options: {
  totalItems:      number
  itemHeight:      number
  containerHeight: number
  overscan?:       number
}) {
  const { itemHeight, containerHeight, overscan = 5 } = options
  const totalItems = ref(options.totalItems)
  const scrollTop  = ref(0)

  const range = computed<VirtualRange>(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const startIndex   = Math.max(0, Math.floor(scrollTop.value / itemHeight) - overscan)
    const endIndex     = Math.min(totalItems.value - 1, startIndex + visibleCount + overscan * 2)
    return {
      startIndex,
      endIndex,
      offsetTop:   startIndex * itemHeight,
      totalHeight: totalItems.value * itemHeight,
    }
  })

  function onScroll(e: Event) {
    scrollTop.value = (e.currentTarget as HTMLDivElement).scrollTop
  }

  function updateTotal(n: number) {
    totalItems.value = n
  }

  return { range, onScroll, updateTotal }
}
