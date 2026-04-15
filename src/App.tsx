import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import styles from './App.module.css'

type Danmaku = {
  id: number
  user: string
  level: number
  content: string
  badge?: string
  isVip?: boolean
  isAdmin?: boolean
}

type Seat = {
  id: number
  name: string
  score?: number
  tag?: string
  avatar?: string
  kind: 'main' | 'guest' | 'mic-open' | 'locked'
  ring: 'blue' | 'pink' | 'none'
}

const initialDanmaku: Danmaku[] = [
  {
    id: 1,
    user: '星予安',
    level: 39,
    badge: '👑',
    content: '不错',
    isVip: true,
  },
  {
    id: 2,
    user: 'susu.',
    level: 33,
    badge: '🎙️',
    content: '歌手：悠米 歌名：恋人祝',
    isVip: true,
    isAdmin: true,
  },
  {
    id: 3,
    user: '予安哥哥',
    level: 33,
    badge: '👑',
    content: '事事尽意，百事从欢',
    isVip: true,
  },
  {
    id: 4,
    user: '悠米',
    level: 25,
    badge: '🎙️',
    content: '@星予安 这是我最喜欢的歌',
    isVip: true,
    isAdmin: true,
  },
  { id: 5, user: '🌭•̀.̫•́✧🌭', level: 2, content: '来了' },
  { id: 6, user: 'dhf100', level: 7, content: '来了' },
]

const toAssetPath = (file: string) => `${import.meta.env.BASE_URL}${file}`

const mainSeats: Seat[] = [
  { id: 2, name: '金融王哥', tag: '1号嘉宾', avatar: toAssetPath('seat-main-1.png'), kind: 'main', ring: 'blue' },
  { id: 3, name: '是菜菜子耶', tag: '2号嘉宾', avatar: toAssetPath('seat-main-2.png'), kind: 'main', ring: 'pink' },
]

const guestSeats: Seat[] = [
  { id: 5, name: '拉比小新', tag: '3号嘉宾', avatar: toAssetPath('seat-guest-3.png'), kind: 'guest', ring: 'none' },
  { id: 6, name: '林美美', tag: '4号嘉宾', avatar: toAssetPath('seat-guest-4.png'), kind: 'guest', ring: 'none' },
  { id: 7, name: '5号麦位', kind: 'mic-open', ring: 'none' },
  { id: 8, name: '6锁麦中', kind: 'locked', ring: 'none' },
]

const aiDanmakuLibrary = [
  '主播唱得太好听了！耳朵怀孕了',
  '这个声音我太可了！循环播放',
  '全麦都是神仙嗓音啊',
  '点歌《小幸运》，希望能被翻牌',
  '主播加油！永远支持你',
  '这个氛围也太好了吧',
  '第一次来，被歌声吸引住了',
  '求主播唱一首《后来》',
  '太治愈了，听完心情都变好了',
  '主播的声音好有磁性',
  '这首歌我单曲循环了好多遍',
  '欢迎新来的朋友，点个关注不迷路',
]

const warmupDanmakuLibrary = [
  '欢迎大家来到晚安语聊房，喜欢的点个关注哦',
  '新来的朋友可以点点关注，每天都有好听的歌',
  '大家有想听的歌可以打在公屏上',
  '感谢大家的陪伴和支持',
  '喜欢哪个歌手可以给她送送小礼物',
  '房间里的小伙伴们晚上好呀',
  '觉得好听的可以点点赞，谢谢大家',
  '欢迎新来的朋友，加入我们的大家庭',
  '主播们都很优秀，大家多多支持',
  '有想上麦唱歌的可以申请哦',
]

const aiRoomSummaryLibrary = [
  '现在是 🎤点歌环节 、想听什么歌，直接打在公屏上👏👏👏，咱们直播间主打一个真诚陪伴🧸，开心最重要～',
  '当前房间气氛偏轻松治愈，大家在聊夜晚情绪和点歌清单，适合继续走温柔歌单。',
  '最近上升话题是“今天最想循环的一首歌”，可以继续围绕回忆杀和共鸣感展开互动。',
  '新进房用户关注度最高的是“谁在唱”和“下一首唱什么”，建议在公屏持续引导点歌。',
]

function pick<T>(list: T[]) {
  return list[Math.floor(Math.random() * list.length)]
}

function getRandomUsername() {
  const prefixes = ['快乐', '可爱', '帅气', '温柔', '酷酷', '甜甜', '萌萌', '阳光']
  const suffixes = ['小猫', '小狗', '小熊', '小兔', '小鹿', '小鱼', '小星', '小云']
  return `${pick(prefixes)}${pick(suffixes)}`
}

function getRandomLevel() {
  return Math.floor(Math.random() * 40) + 1
}

const AUDIENCE_AVATAR_SRCS = [
  toAssetPath('audience-1.png'),
  toAssetPath('audience-2.png'),
  toAssetPath('audience-3.png'),
] as const
/** 从左到右轮流置顶（视觉上从后往前交叠），单位 ms */
const AUDIENCE_ROTATE_INTERVAL_MS = 4200
const ROOM_SUMMARY_AUTO_HIDE_MS = 25_000
const WARMUP_RHYTHM_INTERVAL_MIN_MS = 3_000
const WARMUP_RHYTHM_INTERVAL_RANGE_MS = 800
const AI_GIFT_BANNER_HIDE_MS = 4_000

function App() {
  const [danmakuList, setDanmakuList] = useState(initialDanmaku)
  const [inputText, setInputText] = useState('')
  const [isWarmupActive, setIsWarmupActive] = useState(true)
  const [liveCount, setLiveCount] = useState(53)
  const [audienceFrontIndex, setAudienceFrontIndex] = useState(0)
  const [roomSummary, setRoomSummary] = useState(aiRoomSummaryLibrary[0])
  const [isRoomSummaryVisible, setIsRoomSummaryVisible] = useState(false)
  const [isAIGiftVisible, setIsAIGiftVisible] = useState(false)
  const [activeSeatId, setActiveSeatId] = useState(7)
  const danmakuScrollerRef = useRef<HTMLDivElement | null>(null)
  const warmupTimerRef = useRef<number | null>(null)
  const warmupAlternateRef = useRef(true)
  const roomSummaryHideTimerRef = useRef<number | null>(null)
  const aiGiftHideTimerRef = useRef<number | null>(null)

  const addDanmaku = (item: Omit<Danmaku, 'id'>) => {
    setDanmakuList((prev) => {
      const next = [...prev, { id: Date.now() + Math.random(), ...item }]
      return next.slice(-50)
    })
  }

  const generateAIDanmaku = () => {
    addDanmaku({
      user: getRandomUsername(),
      level: getRandomLevel(),
      content: pick(aiDanmakuLibrary),
      isVip: Math.random() > 0.7,
    })
  }

  const triggerWarmupLoop = () => {
    const delay = WARMUP_RHYTHM_INTERVAL_MIN_MS + Math.random() * WARMUP_RHYTHM_INTERVAL_RANGE_MS
    warmupTimerRef.current = window.setTimeout(() => {
      if (warmupAlternateRef.current) {
        addDanmaku({
          user: 'AI 小芬',
          level: 50,
          badge: '🧙🏻',
          content: pick(warmupDanmakuLibrary),
          isVip: true,
        })
      } else {
        generateAIDanmaku()
      }
      warmupAlternateRef.current = !warmupAlternateRef.current
      triggerWarmupLoop()
    }, delay)
  }

  const toggleWarmup = () => {
    setIsWarmupActive((prev) => {
      if (!prev) {
        warmupAlternateRef.current = true
        window.setTimeout(() => {
          addDanmaku({
            user: 'AI 小芬',
            level: 50,
            content: pick(warmupDanmakuLibrary),
            badge: '🧙🏻',
            isVip: true,
          })
        }, 800)
      } else {
        if (warmupTimerRef.current) {
          window.clearTimeout(warmupTimerRef.current)
          warmupTimerRef.current = null
        }
      }
      return !prev
    })
  }

  const sendNormalDanmaku = () => {
    const content = inputText.trim()
    if (!content) return
    addDanmaku({ user: '我', level: 25, content, isVip: true })
    setInputText('')
  }

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      sendNormalDanmaku()
    }
  }

  useEffect(() => {
    const scroller = danmakuScrollerRef.current
    if (!scroller) return
    scroller.scrollTop = scroller.scrollHeight
  }, [danmakuList])

  useEffect(() => {
    // 兼容热更新保留的旧状态：将历史 AI助手 文案统一迁移到 AI 小芬
    setDanmakuList((prev) =>
      prev.map((item) => {
        if (item.user !== 'AI助手') return item
        return {
          ...item,
          user: 'AI 小芬',
          badge: item.badge === '🤖' ? '🧙🏻' : item.badge,
        }
      }),
    )
  }, [])

  useEffect(() => {
    if (!isWarmupActive) {
      if (warmupTimerRef.current) {
        window.clearTimeout(warmupTimerRef.current)
        warmupTimerRef.current = null
      }
      return
    }
    triggerWarmupLoop()
    return () => {
      if (warmupTimerRef.current) {
        window.clearTimeout(warmupTimerRef.current)
        warmupTimerRef.current = null
      }
    }
  }, [isWarmupActive])

  useEffect(() => {
    const guestSeatIds = [5, 6]
    const timer = window.setInterval(() => {
      setActiveSeatId(guestSeatIds[Math.floor(Math.random() * guestSeatIds.length)])
    }, 10_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLiveCount((n) => n + (Math.random() > 0.6 ? 1 : 0))
    }, 11_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setAudienceFrontIndex((i) => (i + 1) % AUDIENCE_AVATAR_SRCS.length)
    }, AUDIENCE_ROTATE_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [])

  const sendAIDanmakuBatch = () => {
    for (let i = 0; i < 3; i += 1) {
      window.setTimeout(generateAIDanmaku, i * 500)
    }
  }

  const showRoomSummaryTemporarily = () => {
    setIsRoomSummaryVisible(true)
    if (roomSummaryHideTimerRef.current) {
      window.clearTimeout(roomSummaryHideTimerRef.current)
    }
    roomSummaryHideTimerRef.current = window.setTimeout(() => {
      setIsRoomSummaryVisible(false)
      roomSummaryHideTimerRef.current = null
    }, ROOM_SUMMARY_AUTO_HIDE_MS)
  }

  const refreshRoomSummary = () => {
    setRoomSummary((previous) => {
      const options = aiRoomSummaryLibrary.filter((item) => item !== previous)
      return pick(options.length > 0 ? options : aiRoomSummaryLibrary)
    })
    showRoomSummaryTemporarily()
  }

  const sendAIGift = () => {
    setIsAIGiftVisible(true)
    if (aiGiftHideTimerRef.current) {
      window.clearTimeout(aiGiftHideTimerRef.current)
    }
    aiGiftHideTimerRef.current = window.setTimeout(() => {
      setIsAIGiftVisible(false)
      aiGiftHideTimerRef.current = null
    }, AI_GIFT_BANNER_HIDE_MS)
    addDanmaku({
      user: 'AI 小芬',
      level: 50,
      badge: '🧙🏻',
      content: '送上了闪亮荧光棒 x99',
      isVip: true,
    })
  }

  useEffect(() => {
    return () => {
      if (roomSummaryHideTimerRef.current) {
        window.clearTimeout(roomSummaryHideTimerRef.current)
        roomSummaryHideTimerRef.current = null
      }
      if (aiGiftHideTimerRef.current) {
        window.clearTimeout(aiGiftHideTimerRef.current)
        aiGiftHideTimerRef.current = null
      }
    }
  }, [])

  const phoneFrameStyle: CSSProperties = {
    backgroundImage: `linear-gradient(180deg, rgba(7, 8, 30, 0.03) 0%, rgba(7, 8, 30, 0.14) 55%, rgba(7, 8, 30, 0.28) 100%), url('${toAssetPath('room-bg.png')}')`,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
  }

  return (
    <main className={styles.page}>
      {/* 演示者单独使用，不属于手机内界面 UI */}
      <aside className={styles.controlDock} aria-label="演示控制（预览专用）">
        <p className={styles.controlDockTitle}>演示控制</p>
        <p className={styles.controlDockHint}>仅你可见，用于操控下方预览</p>
        <div className={styles.controlDockTools}>
          <div className={styles.controlTool}>
            <button
              type="button"
              className={`${styles.controlDockBtn} ${styles.controlDockBtnMagic}`}
              onClick={sendAIDanmakuBatch}
            >
              🪄
            </button>
            <span className={styles.controlToolLabel}>AI观众</span>
          </div>
          <div className={styles.controlTool}>
            <button
              type="button"
              className={`${styles.controlDockBtn} ${styles.controlDockBtnSummary}`}
              onClick={refreshRoomSummary}
            >
              ✨
            </button>
            <span className={styles.controlToolLabel}>AI房间总结</span>
          </div>
          <div className={styles.controlTool}>
            <button
              type="button"
              className={`${styles.controlDockBtn} ${styles.controlDockBtnGift}`}
              onClick={sendAIGift}
            >
              🎁
            </button>
            <span className={styles.controlToolLabel}>AI礼物</span>
          </div>
          <div className={styles.controlTool}>
            <button
              type="button"
              className={`${styles.controlDockBtn} ${styles.controlDockBtnWarmup} ${isWarmupActive ? styles.controlDockBtnWarmupOn : ''}`}
              onClick={toggleWarmup}
            >
              💬
            </button>
            <span className={styles.controlToolLabel}>AI暖场</span>
          </div>
        </div>
      </aside>

      <section className={styles.phoneFrame} style={phoneFrameStyle}>
        <div className={styles.statusBar}>
          <span className={styles.clock}>19:23</span>
          <span className={styles.statusIcons}>📶 5G 🔋</span>
        </div>

        <header className={styles.topBar}>
          <div className={styles.roomCard}>
            <div className={styles.avatarPlaceholder}>
              <img className={styles.avatarImage} src={toAssetPath('host-avatar.png')} alt="主播头像" />
            </div>
            <div>
              <div className={styles.roomTitle}>晚安✨ 语...</div>
              <div className={styles.roomSubtitle}>1.5万本场点赞</div>
            </div>
          </div>
          <div className={styles.topRight}>
            <button className={styles.memberBtn} type="button">
              💛 会员
            </button>
            <div className={styles.audienceCluster} aria-label="在线观众">
              <div className={styles.onlineAvatarStack}>
                {AUDIENCE_AVATAR_SRCS.map((src, index) => (
                  <span
                    key={src}
                    className={`${styles.onlineAvatarWrap} ${
                      audienceFrontIndex === index ? styles.onlineAvatarFront : ''
                    }`}
                  >
                    <img className={styles.onlineAvatarImg} src={src} alt="" />
                  </span>
                ))}
              </div>
              <div className={styles.audienceCounts}>
                <span className={styles.onlineCount}>{liveCount}</span>
              </div>
            </div>
            <button className={styles.closeBtn} type="button" aria-label="关闭">
              ✕
            </button>
          </div>
        </header>

        <section className={styles.eventRow}>
          <div className={styles.mvpCard}>MVP · 21:36</div>
          <div className={styles.raceCard}>嘉宾周星赛 赢取专属限定麦圈 🏆</div>
        </section>

        <section className={styles.micSection}>
          <div className={styles.micMainRow}>
            {mainSeats.map((seat, index) => (
              <article key={seat.id} className={`${styles.micItem} ${styles.micMainItem}`}>
                <div
                  className={`${styles.micAvatar} ${styles.micMainAvatar} ${index === 0 ? styles.mainBlueWave : styles.mainPinkWave}`}
                >
                  <span className={styles.micInnerPlaceholder}>
                    {seat.avatar ? (
                      <img className={styles.seatAvatarImage} src={seat.avatar} alt={seat.name} />
                    ) : (
                      '图'
                    )}
                  </span>
                  <span className={styles.mainWaveRing} />
                  <span className={styles.mainWaveRingSecondary} />
                </div>
                <div className={`${styles.seatTag} ${index === 0 ? styles.seatTagBlue : styles.seatTagPink}`}>{seat.tag}</div>
                <div className={styles.micName}>{seat.name}</div>
              </article>
            ))}
          </div>

          <div className={styles.micGuestRow}>
            {guestSeats.map((seat) => (
              <article key={seat.id} className={styles.micItem}>
                <div
                  className={`${styles.micAvatar} ${seat.id === activeSeatId && seat.kind === 'guest' ? styles.micActive : ''} ${seat.kind === 'mic-open' || seat.kind === 'locked' ? styles.micDisabled : ''}`}
                >
                  {seat.kind === 'mic-open' ? (
                    <span className={styles.placeholderIcon}>
                      <img src={toAssetPath('mic-icon.svg')} alt="麦克风" className={styles.seatStatusIcon} />
                    </span>
                  ) : seat.kind === 'locked' ? (
                    <span className={styles.placeholderIcon}>
                      <img src={toAssetPath('lock-icon.svg')} alt="锁麦" className={styles.seatStatusIcon} />
                    </span>
                  ) : (
                    <span className={styles.micInnerPlaceholder}>
                      {seat.avatar ? (
                        <img className={styles.seatAvatarImage} src={seat.avatar} alt={seat.name} />
                      ) : (
                        '图'
                      )}
                    </span>
                  )}
                  {seat.id === activeSeatId && seat.kind === 'guest' && <span className={styles.speakingRing} />}
                </div>
                {seat.tag && <div className={`${styles.seatTag} ${styles.seatTagBlue}`}>{seat.tag}</div>}
                {seat.kind === 'mic-open' || seat.kind === 'locked' ? (
                  <div className={styles.seatNameRow}>
                    <span className={styles.seatNoBadge}>{seat.id}</span>
                    <span className={styles.micName}>{seat.kind === 'mic-open' ? '号麦位' : '锁麦中'}</span>
                  </div>
                ) : (
                  <div className={styles.micName}>{seat.name}</div>
                )}
              </article>
            ))}
          </div>
        </section>

        {isRoomSummaryVisible && (
          <section className={styles.aiSummaryPanel} aria-live="polite">
            <div className={styles.aiSummaryCard}>
              <p className={styles.aiSummaryTitle}>
                <img className={styles.aiSummaryIcon} src={toAssetPath('ai-room-assistant-icon.svg')} alt="" />
                <span className={styles.aiSummaryTitleText}>AI 房间助手：</span>
                <span className={styles.aiSummaryTitleExtra}>🎤点歌环节 ➕ 🩵 粉丝连麦 ➕ 🤦‍♀️ 真心话</span>
              </p>
              <p className={styles.aiSummaryContent}>{roomSummary}</p>
            </div>
          </section>
        )}

        {isAIGiftVisible && (
          <section className={styles.aiGiftPanel} aria-live="polite">
            <img
              src={toAssetPath('ai-gift-banner-4x.png')}
              alt="AI礼物打赏提示"
              className={styles.aiGiftBannerImage}
            />
          </section>
        )}

        <section className={styles.danmakuSection}>
          <div ref={danmakuScrollerRef} className={styles.danmakuList}>
            {danmakuList.map((item) => (
              <div key={item.id} className={styles.danmakuItem}>
                <span className={styles.levelTag}>{item.level}</span>
                <div className={styles.danmakuText}>
                  {item.isVip && item.user !== 'AI 小芬' && item.user !== 'AI助手' && (
                    <span className={styles.vipTag}>10</span>
                  )}
                  {item.isAdmin && <span className={styles.adminTag}>管</span>}
                  {item.badge && <span className={styles.badge}>{item.badge}</span>}
                  <span
                    className={`${styles.userName} ${
                      item.user === 'AI 小芬' ? styles.aiAssistantName : ''
                    }`}
                  >
                    {item.user}
                  </span>
                  <span className={styles.content}>：{item.content}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className={styles.bottomBar}>
          <div className={styles.inputWrap}>
            <input
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              onKeyDown={onInputKeyDown}
              className={styles.input}
              placeholder="说点什么..."
            />
            <button className={styles.emojiBtn} type="button" aria-label="表情">
              <img className={styles.toolbarEmojiIcon} src={toAssetPath('toolbar-emoji.svg')} alt="" />
            </button>
          </div>
          <button
            type="button"
            className={styles.applyMicBtn}
            onClick={() =>
              addDanmaku({
                user: '我',
                level: 1,
                content: '已申请上麦',
                badge: '🎙️',
              })
            }
          >
            申请上麦
          </button>
          <button type="button" className={styles.giftIconBtn} aria-label="礼物">
            <img src={toAssetPath('gift-icon.png')} alt="" width={22} height={22} />
          </button>
          <button type="button" className={styles.moreMenuBtn} aria-label="更多">
            <img className={styles.toolbarMoreIcon} src={toAssetPath('toolbar-more.svg')} alt="" />
            <span className={styles.moreMenuBadge} />
          </button>
        </footer>
      </section>
    </main>
  )
}

export default App
