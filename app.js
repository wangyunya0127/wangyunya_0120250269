// 第 4 课：用 JavaScript 让页面"活"起来。
//
// 本课共七个 TODO，每一个作用在页面的**不同位置**，效果互不重叠：
//   TODO 01  顶部      一条阅读进度条，随滚动变长
//   TODO 02  右下角    一个小徽标，显示当前在哪个栏目
//   TODO 03  顶部导航  当前那一项高亮
//   TODO 04  交互      点导航、按后退键，高亮跟着走
//   TODO 05  右下角    滚过一屏浮出"返回顶部"圆按钮
//   TODO 06  滚动      不用点，往下滚高亮自己跟着换
//   TODO 07  整页      每个栏目进入视口时淡入上移
//
// 重要前提：HTML 里的 <a href="#skills"> 本身就能跳转，**不需要 JavaScript**。
// JS 在这一课只负责"告诉用户现在在哪""让页面更好用"，不接管跳转。
// 这叫渐进增强（progressive enhancement）：JS 挂了页面照样能读，只是少了提示。

// ===================== 准备：把要用到的元素抓到手 =====================
// querySelector  按选择器找第一个，找不到返回 null
// querySelectorAll 按选择器找全部，返回一个可以 forEach 的集合
// 选择器写法和 CSS 完全一样：#id 找 id，.class 找类，nav a 找范围里的 a
const progressBar = document.querySelector('#reading-progress')
const indicator = document.querySelector('#section-indicator')
const toTopButton = document.querySelector('#to-top')
const navLinks = document.querySelectorAll('nav a')

// 页面上所有栏目。hero 是首屏，section 是其余栏目，两类都要。
const sections = document.querySelectorAll('main .hero[id], main section[id]')

// 导航链接上的文字就是栏目的中文名，直接拿来用，不另外维护一份对照表。
// 好处：以后在 HTML 里加一个栏目，这个文件一行都不用改。
const sectionNames = new Map()
navLinks.forEach(link => {
  sectionNames.set(link.getAttribute('href'), link.textContent.trim())
})

// ===================== TODO 01：顶部阅读进度条 =====================
// 效果位置：页面最上沿，一条横贯全屏的细线。
//
// 算法：已经滚过的距离 ÷ 能滚的总距离 = 读了百分之多少。
//   scrollY          已经向下滚了多少像素
//   scrollHeight     整个文档的总高度
//   innerHeight      窗口可视高度
//   能滚的总距离 = scrollHeight - innerHeight
function updateProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight
  // 页面太短时 scrollable 可能是 0，除以 0 会得到 NaN，进度条就不动了。
  // 这种"分母可能为 0"的地方一定要先挡一下。
  const ratio = scrollable > 0 ? window.scrollY / scrollable : 0
  progressBar.style.width = `${ratio * 100}%`
}

// ============ TODO 02、03：把"当前栏目"反映到界面上 ============
function showCurrent(hash) {
  // 没有 # 时默认第一个栏目，否则刚打开页面什么都不高亮
  const current = hash || '#about'

  // TODO 02 效果位置：右下角的小徽标
  // Map.get 取不到时返回 undefined，用 || '' 兜底，别让页面出现 "undefined"
  indicator.textContent = sectionNames.get(current) || ''

  navLinks.forEach(link => {
    const isCurrent = link.getAttribute('href') === current

    // TODO 03 效果位置：顶部导航
    // toggle(类名, 要不要加)：true 加上，false 去掉。
    // 等价于 if (isCurrent) add() else remove()，但更短。
    // **高亮长什么样由 CSS 的 nav a.is-current 决定，JS 只管什么时候加这个类。**
    link.classList.toggle('is-current', isCurrent)

    // 顺带做：告诉读屏软件"当前在这一项"。视觉上看不见，
    // 但在 F12 的 Elements 面板里能看到它跟着高亮移动。
    // 无障碍不是额外功能，是基本要求。
    if (isCurrent) link.setAttribute('aria-current', 'location')
    else link.removeAttribute('aria-current')
  })
}

// ============ TODO 04：点导航、按前进后退，高亮都要跟着走 ============
// 地址栏里 # 后面那一段叫 hash。点 <a href="#skills"> 会把它改成 #skills，
// hash 一变浏览器就触发 hashchange 事件；按前进/后退键也会触发。
window.addEventListener('hashchange', () => showCurrent(location.hash))

// 还要在这里**直接调用一次**。
// 不写的话，直接访问 index.html#skills 进来什么都不高亮——
// 因为 hash 从头到尾没有"变化"过，hashchange 不会触发。这是本课最常漏的一行。
showCurrent(location.hash)

// ============ TODO 05：滚过一屏，浮出"返回顶部" ============
// 效果位置：右下角的圆按钮。
toTopButton.addEventListener('click', () => {
  // behavior:'smooth' 让它平滑滚上去，而不是瞬间跳
  window.scrollTo({ top: 0, behavior: 'smooth' })
  // 回到顶部后地址栏的 # 还停在原处，手动同步一下，
  // 否则徽标还写着刚才那个栏目
  history.replaceState(null, '', location.pathname)
  showCurrent('#about')
})

// ============ 滚动时要做两件事，合成一个监听器 ============
// 为什么不写两个 addEventListener('scroll')？可以，但滚动一秒能触发几十次，
// 监听器越少越好。这里一次滚动做两件事：更新进度条、决定按钮显不显示。
window.addEventListener('scroll', () => {
  updateProgress() // TODO 01
  // TODO 05 的另一半：滚过大半屏才显示按钮。
  // 用 innerHeight * 0.6 而不是写死 500px——手机屏和电脑屏高度差很多。
  toTopButton.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.6)
})

// 首屏也要算一次，否则刷新页面时进度条是 0，但其实已经滚在中间了
updateProgress()

// ============ TODO 06：往下滚，高亮自己跟着走（scroll spy）============
// 效果位置：顶部导航 + 右下角徽标，**不用点任何东西**。
//
// IntersectionObserver 是浏览器内置的"监视器"：告诉它盯哪些元素，
// 这些元素进出视口时它通知你。
// 为什么不在 scroll 里自己算？可以，但 scroll 一秒触发几十次，
// 每次都去算七个栏目的位置会让页面发卡；这个 API 由浏览器底层实现，
// 只在真的进出时才通知，省事也省性能。
const spy = new IntersectionObserver(
  entries => {
    for (const entry of entries) {
      // isIntersecting：这个元素现在在（收窄后的）视口里吗
      if (entry.isIntersecting) showCurrent(`#${entry.target.id}`)
    }
  },
  {
    // rootMargin 把判定用的视口上下各收窄 45%，只剩中间一条。
    // 必须滚到屏幕中间才算"进入这个栏目"。
    // 不收窄的话，栏目刚露头就切换，滚动时高亮会来回乱跳。
    rootMargin: '-45% 0px -45% 0px',
  },
)
sections.forEach(section => spy.observe(section))

// ============ TODO 07：栏目进入视口时淡入上移 ============
// 效果位置：整页内容。这是七个任务里覆盖面最大的一个。
//
// 复用上面刚学会的 IntersectionObserver，但这次的选项完全不同：
//   threshold: 0.15  露出 15% 就算进入（上面那个是收窄到中间才算）
//   进入后 unobserve  只淡入一次，往回滚不会再淡一遍
const reveal = new IntersectionObserver(
  (entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      entry.target.classList.add('is-visible')
      // 已经显示过就不用再盯着它了，省性能
      observer.unobserve(entry.target)
    }
  },
  { threshold: 0.15 },
)
sections.forEach(section => reveal.observe(section))

// ============ 夜间/白天模式切换 ============
// 效果位置：顶部右侧的圆形按钮。JS 只负责切换 body 的 dark 类，
// 长什么样全部由 CSS 的 body.dark 规则决定（和导航高亮同一个思路）。
// 选择存进 localStorage，下次打开还记得；第一次访问跟随系统偏好。
const themeToggle = document.querySelector('#theme-toggle')
const THEME_KEY = 'preferred-theme'

function applyTheme(theme) {
  const dark = theme === 'dark'
  document.body.classList.toggle('dark', dark)
  // 按钮图标跟着换：夜间显示太阳（点它回白天），白天显示月亮。
  themeToggle.textContent = dark ? '☀️' : '🌙'
  themeToggle.setAttribute('aria-label', dark ? '切换到白天模式' : '切换到夜间模式')
}

// localStorage 里存过就用存的；没存过看系统设置（很多系统夜间会自动变）。
const savedTheme = localStorage.getItem(THEME_KEY)
const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
applyTheme(savedTheme || (systemDark ? 'dark' : 'light'))

themeToggle.addEventListener('click', () => {
  const next = document.body.classList.contains('dark') ? 'light' : 'dark'
  localStorage.setItem(THEME_KEY, next)
  applyTheme(next)
})
