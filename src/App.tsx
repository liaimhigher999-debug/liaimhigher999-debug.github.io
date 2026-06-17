import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { assetCredits, eras } from './data/eras'
import { tourScenes } from './data/experience'
import type { AlbumYear, Era, ExplorationClue, FanProfile, TourScene, Track } from './data/types'
import { appEnvironment } from './env'
import { buildArchiveHash, findTrack, parseArchiveHash } from './domain/archive'
import {
  createJourneyId,
  createInitialExperience,
  experienceReducer,
  isEraGateOpen,
  type ExperiencePhase,
} from './domain/experience'
import { chooseInitialVideoQuality, type VideoQuality } from './domain/media'
import {
  loadFanProfile,
  loadJourney,
  loadTicketTheme,
  saveFanProfile,
  saveJourney,
  saveTicketTheme,
} from './domain/persistence'
import {
  copyText,
  createBrowserShareEnvironment,
} from './domain/share'
import {
  createTicketBackSvg,
  createTicketKeepsakeSvg,
  createTicketSvg,
  deriveTicketData,
  getTicketEditionNumber,
  ticketThemes,
  type TicketData,
  type TicketThemeId,
} from './domain/ticket'

type ArchiveSelection = {
  era: Era
  track: Track
}

const themeStyle = (era: Era) =>
  ({
    '--active-accent': era.theme.accent,
    '--active-bg': era.theme.background,
    '--active-fg': era.theme.foreground,
    '--era-accent': era.theme.accent,
    '--era-bg': era.theme.background,
    '--era-fg': era.theme.foreground,
  }) as CSSProperties

const getArchiveSelection = (hash: string): ArchiveSelection | null => {
  const location = parseArchiveHash(hash)
  return location ? findTrack(eras, location.eraId, location.trackSlug) : null
}

const ListenMenu = ({ track }: { track: Track }) => (
  <details className="listen-menu">
    <summary>
      LISTEN <span aria-hidden="true">↗</span>
    </summary>
    <div className="listen-menu__options">
      <a href={track.links.spotify} target="_blank" rel="noreferrer">
        Spotify
      </a>
      <a href={track.links.appleMusic} target="_blank" rel="noreferrer">
        Apple Music
      </a>
      <a href={track.links.youtube} target="_blank" rel="noreferrer">
        YouTube
      </a>
    </div>
  </details>
)

const useReducedMotion = () => {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return reduced
}

const PROLOGUE_ENTER_MS = 1450
const PROLOGUE_ENTER_REDUCED_MS = 260
const BAND_INTRO_EXIT_MS = 260

type IntroductionLanguage = 'en' | 'zh'

type LocalizedIntroduction = {
  title: string
  eyebrow: string
  paragraphs: string[]
  statement: string
  keywords: string[]
}

const albumIntroductions: Record<AlbumYear, Record<IntroductionLanguage, LocalizedIntroduction>> = {
  '2013': {
    en: {
      eyebrow: '2013 / THE DEBUT ALBUM',
      title: 'A NIGHT WITH NO CLEAR ENDING.',
      paragraphs: [
        'The 1975 introduced the band as a world of glowing rectangles, wet streets and young people moving too quickly to explain themselves. Its black-and-white surface made every emotion feel immediate: desire, bravado, loneliness and escape.',
        'Guitars and drums sit beside glossy pop instincts, ambient passages and R&B rhythm. The songs already contain the contradiction that would define the band: they sound completely certain while describing people who are anything but.',
      ],
      statement: 'This is where the Box became both a logo and a doorway.',
      keywords: ['MONOCHROME', 'YOUTH', 'ESCAPE'],
    },
    zh: {
      eyebrow: '2013 / 首张同名专辑',
      title: '一场没有明确终点的夜晚。',
      paragraphs: [
        '《The 1975》用发光的矩形、潮湿的街道和来不及解释自己的年轻人，建立了乐队最初的世界。黑白视觉让欲望、逞强、孤独与逃离都显得直接而锋利。',
        '吉他与鼓点之间同时存在流行旋律、氛围段落和 R&B 律动。那些歌曲听起来无比笃定，写的却全是不确定的人，这种矛盾从此成为乐队最迷人的部分。',
      ],
      statement: '从这里开始，Box 既是标志，也是一扇门。',
      keywords: ['黑白', '青春', '逃离'],
    },
  },
  '2016': {
    en: {
      eyebrow: '2016 / I LIKE IT WHEN YOU SLEEP',
      title: 'PINK LIGHT OVER A RESTLESS MIND.',
      paragraphs: [
        'The second album opened the monochrome Box and flooded it with pink. Everything became larger: the choruses, the synthesizers, the ambition and the fear of being alone after the lights go out.',
        'Its long title and shifting forms refuse simplicity. Funk, dream pop, gospel, ambient music and acoustic confession coexist, turning romance into something beautiful, artificial and painfully self-aware.',
      ],
      statement: 'Pink does not mean uncomplicated happiness.',
      keywords: ['NEON', 'ROMANCE', 'SELF-DOUBT'],
    },
    zh: {
      eyebrow: '2016 / 突然好想你入睡时的样子',
      title: '粉色灯光照着一颗不安的心。',
      paragraphs: [
        '第二张专辑打开黑白的 Box，让整个世界突然泛起粉色。副歌、合成器、野心，以及灯光熄灭后对孤独的恐惧，都被放得更大。',
        '漫长的专辑名和不断变化的曲风拒绝被简单概括。放克、梦幻流行、福音、氛围音乐与木吉他自白共存，让浪漫同时显得美丽、人工，并且痛苦地自知。',
      ],
      statement: '粉色从来不代表简单的快乐。',
      keywords: ['霓虹', '浪漫', '自我怀疑'],
    },
  },
  '2018': {
    en: {
      eyebrow: '2018 / A BRIEF INQUIRY',
      title: 'CONNECTED TO EVERYTHING. CLOSE TO NO ONE.',
      paragraphs: [
        'A Brief Inquiry asks what intimacy means when life is filtered through screens, notifications and endless public performance. It is the band at its most outward-looking, examining addiction, politics, loneliness and the strange optimism of staying alive.',
        'The music jumps from sharp guitar pop to Auto-Tuned intimacy, jazz, electronics and orchestral release. Its fragmentation feels deliberate: the internet is not one sound, so the record refuses to become one sound either.',
      ],
      statement: 'A modern-life record that still believes human closeness is possible.',
      keywords: ['INTERNET', 'ANXIETY', 'HOPE'],
    },
    zh: {
      eyebrow: '2018 / 网络关系的简短问询',
      title: '连接一切，却未必靠近任何人。',
      paragraphs: [
        '《A Brief Inquiry》追问：当生活经过屏幕、通知和持续不断的公开表演过滤之后，亲密究竟意味着什么。它把成瘾、政治、孤独，以及继续活下去那种奇怪的乐观放在同一张唱片里。',
        '音乐从锋利的吉他流行跳到 Auto-Tune 式私语、爵士、电子和管弦释放。它的碎片感是刻意的：互联网不是一种声音，所以这张专辑也拒绝只成为一种声音。',
      ],
      statement: '它描写现代生活，却仍相信人与人可以真正靠近。',
      keywords: ['互联网', '焦虑', '希望'],
    },
  },
  '2020': {
    en: {
      eyebrow: '2020 / NOTES ON A CONDITIONAL FORM',
      title: 'TOO MANY TABS. NO FINAL VERSION.',
      paragraphs: [
        'Notes on a Conditional Form behaves like an open browser with every tab still playing. UK garage, country, punk, house, folk and ambient sketches collide in a record about climate, distance, memory and unfinished identity.',
        'Its messiness is part of the idea. Rather than offer a clean statement, the album documents overload: too much information, too many possible selves and the attempt to find a sincere voice inside all that noise.',
      ],
      statement: 'The unfinished shape is the portrait.',
      keywords: ['COLLAGE', 'OVERLOAD', 'SEARCHING'],
    },
    zh: {
      eyebrow: '2020 / 情况剧变下的形式笔记',
      title: '太多标签页，没有最终版本。',
      paragraphs: [
        '《Notes on a Conditional Form》像一台所有标签页都在播放的浏览器。英伦车库、乡村、朋克、House、民谣和氛围草图彼此碰撞，讨论气候、距离、记忆与尚未完成的身份。',
        '混乱本身就是概念。它不提供一份整洁声明，而是记录信息过载：太多内容、太多可能的自我，以及一个人如何在噪声中寻找真正诚实的声音。',
      ],
      statement: '未完成的形状，本身就是这张肖像。',
      keywords: ['拼贴', '过载', '寻找'],
    },
  },
  '2022': {
    en: {
      eyebrow: '2022 / BEING FUNNY IN A FOREIGN LANGUAGE',
      title: 'BACK IN THE ROOM. NOTHING TO HIDE BEHIND.',
      paragraphs: [
        'Being Funny in a Foreign Language brings the band back into one room. The arrangements are warmer and more focused, built from live drums, piano, guitars and carefully shaped pop songwriting rather than endless stylistic detours.',
        'The record asks whether sincerity can survive performance. Its love songs are tender but observant, aware that even the most honest sentence becomes a pose once someone is watching.',
      ],
      statement: 'After every reinvention, the most radical move was to sound present.',
      keywords: ['LIVE ROOM', 'SINCERITY', 'TOGETHERNESS'],
    },
    zh: {
      eyebrow: '2022 / 用另一种语言讲笑话',
      title: '回到房间里，不再躲在风格后面。',
      paragraphs: [
        '《Being Funny in a Foreign Language》让乐队重新回到同一个房间。现场鼓、钢琴、吉他与更集中精确的流行写作，取代了上一张专辑不断岔开的风格路径。',
        '它追问真诚能否在表演中存在。这里的情歌温柔，却始终保持观察：即使最诚实的一句话，只要有人注视，也可能成为某种姿态。',
      ],
      statement: '经历所有重塑之后，最激进的选择反而是活在当下。',
      keywords: ['现场房间', '真诚', '在一起'],
    },
  },
}

const ChineseDisplayText = ({ text }: { text: string }) => {
  const content: ReactNode[] = []
  const punctuation = new Set(['，', '。', '！', '？', '：', '；', '、'])

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    const nextCharacter = text[index + 1]

    if (nextCharacter && punctuation.has(nextCharacter)) {
      content.push(
        <span className="zh-punctuation-pair" key={`${index}-${character}`}>
          {character}<span className="zh-punctuation">{nextCharacter}</span>
        </span>,
      )
      index += 1
    } else if (punctuation.has(character)) {
      content.push(<span className="zh-punctuation" key={`${index}-${character}`}>{character}</span>)
    } else {
      content.push(character)
    }
  }

  return <>{content}</>
}

const BandIntroduction = ({
  onClose,
  onEnter,
}: {
  onClose: () => void
  onEnter: () => void
}) => {
  const [language, setLanguage] = useState<IntroductionLanguage>('en')
  const chinese = language === 'zh'

  return (
    <section aria-label="About The 1975" aria-modal="true" className="band-introduction" lang={chinese ? 'zh-CN' : 'en'} role="dialog">
      <div className="band-introduction__image" aria-hidden="true" />
      <div className="band-introduction__frame" aria-hidden="true" />

      <header className="band-introduction__header">
        <p>THE 1975 / {chinese ? '乐队简介' : 'A SHORT INTRODUCTION'}</p>
        <div className="introduction-language" aria-label="Introduction language">
          <button
            aria-pressed={!chinese}
            className={!chinese ? 'is-active' : ''}
            onClick={() => setLanguage('en')}
            type="button"
          >
            EN
          </button>
          <button
            aria-pressed={chinese}
            className={chinese ? 'is-active' : ''}
            onClick={() => setLanguage('zh')}
            type="button"
          >
            中文
          </button>
        </div>
        <button onClick={onClose} type="button">
          {chinese ? '返回 BOX' : 'BACK TO THE BOX'} <span aria-hidden="true">×</span>
        </button>
      </header>

      <div className={`band-introduction__copy ${chinese ? 'is-chinese' : ''}`}>
        <p className="eyebrow">{chinese ? '威姆斯洛 / 自 2002 年一起创作' : 'WILMSLOW / TOGETHER SINCE 2002'}</p>
        <h2>
          {chinese ? (
            <><ChineseDisplayText text="四个朋友。" /><br /><ChineseDisplayText text="一场仍在继续的" /><br /><ChineseDisplayText text="对话。" /></>
          ) : (
            <>FOUR FRIENDS.<br />ONE CONTINUING<br />CONVERSATION.</>
          )}
        </h2>
        <p>
          {chinese
            ? 'The 1975 始于四个在学校里一起学习如何成为乐队的朋友。Matty Healy、George Daniel、Adam Hann 与 Ross MacDonald，把漫长的友谊变成了一种既宏大又亲密的音乐。'
            : 'The 1975 began as school friends learning how to become a band together. Matty Healy, George Daniel, Adam Hann and Ross MacDonald turned that long friendship into music that can feel enormous and intimate at the same time.'}
        </p>
        <p>
          {chinese
            ? '他们在另类摇滚、明亮流行、氛围电子、车库、民谣与朋克之间不断移动。真正把这些声音连在一起的是矛盾：浪漫与焦虑、真诚与表演、完美副歌与棘手问题始终同时存在。'
            : 'Their records move through alternative rock, bright pop, ambient electronics, garage, folk and punk without settling into one category. What holds it together is the tension: romance beside anxiety, sincerity beside performance, a perfect chorus beside a difficult question.'}
        </p>
      </div>

      <div className="band-introduction__members" aria-label="Band members">
        <span><b>MATTHEW HEALY</b>{chinese ? '主唱 / 文字' : 'VOICE / WORDS'}</span>
        <span><b>GEORGE DANIEL</b>{chinese ? '鼓 / 制作' : 'DRUMS / PRODUCTION'}</span>
        <span><b>ADAM HANN</b>{chinese ? '吉他' : 'GUITAR'}</span>
        <span><b>ROSS MACDONALD</b>{chinese ? '贝斯' : 'BASS'}</span>
      </div>

      <blockquote className={chinese ? 'is-chinese' : ''}>
        <span>{chinese ? '他们的魅力并不来自完美。' : 'THEIR CHARM IS NOT PERFECTION.'}</span>
        {chinese
          ? <ChineseDisplayText text="而是每一种矛盾，都被真实地留在了房间里。" />
          : 'It is the feeling that every contradiction has been left in the room.'}
      </blockquote>

      <button className="band-introduction__enter" onClick={onEnter} type="button">
        {chinese ? '进入五个房间' : 'ENTER THE FIVE ROOMS'} <span aria-hidden="true">↗</span>
      </button>
    </section>
  )
}

const AlbumIntroduction = ({
  era,
  onClose,
}: {
  era: Era
  onClose: () => void
}) => {
  const [language, setLanguage] = useState<IntroductionLanguage>('en')
  const chinese = language === 'zh'
  const introduction = albumIntroductions[era.year as AlbumYear][language]

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <section
      aria-label={`${era.title} album introduction`}
      aria-modal="true"
      className={`album-introduction album-introduction--${era.theme.key}`}
      lang={chinese ? 'zh-CN' : 'en'}
      role="dialog"
      style={themeStyle(era)}
    >
      <div className="album-introduction__atmosphere" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <header className="album-introduction__header">
        <p>{introduction.eyebrow}</p>
        <div className="introduction-language" aria-label="Album introduction language">
          <button
            aria-pressed={!chinese}
            className={!chinese ? 'is-active' : ''}
            onClick={() => setLanguage('en')}
            type="button"
          >
            EN
          </button>
          <button
            aria-pressed={chinese}
            className={chinese ? 'is-active' : ''}
            onClick={() => setLanguage('zh')}
            type="button"
          >
            中文
          </button>
        </div>
        <button className="album-introduction__close" onClick={onClose} type="button">
          {chinese ? '返回房间' : 'BACK TO THE ROOM'} <span aria-hidden="true">×</span>
        </button>
      </header>

      <div className="album-introduction__cover">
        <img alt={`${era.title} album cover`} src={era.coverUrl} />
        <span>{era.releaseDate}</span>
      </div>

      <article className={`album-introduction__content ${chinese ? 'is-chinese' : ''}`}>
        <p className="album-introduction__number">0{eras.indexOf(era) + 1} / {era.year}</p>
        <h2>{chinese ? <ChineseDisplayText text={introduction.title} /> : introduction.title}</h2>
        {introduction.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <blockquote>{chinese ? <ChineseDisplayText text={introduction.statement} /> : introduction.statement}</blockquote>
        <div className="album-introduction__keywords">
          {introduction.keywords.map((keyword, index) => (
            <span key={keyword}><i>0{index + 1}</i>{keyword}</span>
          ))}
        </div>
      </article>

      <p className="album-introduction__title-mark" aria-hidden="true">{era.shortTitle}</p>
    </section>
  )
}

const Prologue = ({
  onEnter,
  onSkip,
  reducedMotion,
}: {
  onEnter: () => void
  onSkip: () => void
  reducedMotion: boolean
}) => {
  const [entering, setEntering] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const enterTimer = useRef<number | null>(null)
  const aboutExitTimer = useRef<number | null>(null)

  useEffect(() => () => {
    if (enterTimer.current) {
      window.clearTimeout(enterTimer.current)
    }
    if (aboutExitTimer.current) {
      window.clearTimeout(aboutExitTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!aboutOpen) {
      return
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAboutOpen(false)
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [aboutOpen])

  const beginEntrance = () => {
    if (entering) {
      return
    }

    setEntering(true)
    enterTimer.current = window.setTimeout(
      onEnter,
      reducedMotion ? PROLOGUE_ENTER_REDUCED_MS : PROLOGUE_ENTER_MS,
    )
  }

  const enterFromIntroduction = () => {
    setAboutOpen(false)
    aboutExitTimer.current = window.setTimeout(beginEntrance, BAND_INTRO_EXIT_MS)
  }

  return (
    <section className={`prologue-stage ${entering ? 'is-entering' : ''}`}>
      <div className="prologue-stage__noise" />
      <div className="prologue-stage__threshold" aria-hidden="true">
        <span>ROOM 01 / AFTER DARK</span>
      </div>
      <p className="eyebrow prologue-stage__meta">A NON-OFFICIAL ARCHIVE / WILMSLOW / 2013—2022</p>
      <div className="prologue-stage__box" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="prologue-stage__title">
        <span>ENTER</span>
        <h1>
          THE
          <br />
          1975
        </h1>
        <p>五张专辑，五次穿过同一个 Box。</p>
      </div>
      <div className="prologue-stage__actions">
        <button disabled={entering} onClick={beginEntrance} type="button">
          ENTER THE ROOMS <span>↗</span>
        </button>
      </div>
      <button
        className="prologue-stage__about"
        disabled={entering}
        onClick={() => setAboutOpen(true)}
        type="button"
      >
        <span>WHO ARE</span>
        THE 1975? <i aria-hidden="true">↗</i>
      </button>
      <button className="prologue-stage__skip" disabled={entering} onClick={onSkip} type="button">
        SKIP TO ARCHIVE
      </button>
      {aboutOpen ? (
        <BandIntroduction onClose={() => setAboutOpen(false)} onEnter={enterFromIntroduction} />
      ) : null}
    </section>
  )
}

const LayerStack = ({
  activeEraIndex,
  unlockedEraIndexes,
}: {
  activeEraIndex: number
  unlockedEraIndexes: number[]
}) => (
  <div className="layer-stack" aria-hidden="true">
    {unlockedEraIndexes
      .filter((eraIndex) => eraIndex !== activeEraIndex)
      .map((eraIndex) => {
        const era = eras[eraIndex]
        const depth = Math.max(activeEraIndex - eraIndex, 1)
        return (
          <div
            className={`layer-stack__room layer-stack__room--${era.theme.key}`}
            key={era.year}
            style={{ '--layer-depth': depth } as CSSProperties}
          >
            <span>{era.year}</span>
            <i />
          </div>
        )
      })}
  </div>
)

const AlbumShelf = ({
  activeEraIndex,
  unlockedEraIndexes,
  onVisit,
}: {
  activeEraIndex: number
  unlockedEraIndexes: number[]
  onVisit: (eraIndex: number) => void
}) => (
  <nav className="album-shelf" aria-label="Unlocked albums">
    <span className="album-shelf__label">UNLOCKED ROOMS</span>
    {unlockedEraIndexes.map((eraIndex) => {
      const era = eras[eraIndex]
      return (
        <button
          aria-current={activeEraIndex === eraIndex ? 'step' : undefined}
          className={activeEraIndex === eraIndex ? 'is-active' : ''}
          key={era.year}
          onClick={() => onVisit(eraIndex)}
          type="button"
        >
          <img alt="" src={era.coverUrl} />
          <span>{era.year}</span>
        </button>
      )
    })}
  </nav>
)

const ClueObject = ({
  clue,
  explored,
  onExplore,
}: {
  clue: ExplorationClue
  explored: boolean
  onExplore: (clue: ExplorationClue) => void
}) => (
  <button
    className={`clue-object clue-object--${clue.type} ${explored ? 'is-explored' : ''}`}
    onClick={() => onExplore(clue)}
    type="button"
  >
    <span>{clue.kicker}</span>
    <strong>{clue.title}</strong>
    <i>{explored ? 'OPENED' : 'TOUCH TO OPEN'}</i>
  </button>
)

const CluePanel = ({
  clue,
  onClose,
}: {
  clue: ExplorationClue
  onClose: () => void
}) => (
  <aside className={`clue-panel clue-panel--${clue.type}`} role="dialog" aria-label={clue.title}>
    <button className="clue-panel__close" onClick={onClose} type="button">
      CLOSE ×
    </button>
    <p className="eyebrow">{clue.kicker}</p>
    <h3>{clue.title}</h3>
    <p>{clue.body}</p>
  </aside>
)

const EraRoom = ({
  era,
  eraIndex,
  exploredClueIds,
  gateOpen,
  onExplore,
  onAdvance,
  onIntroduce,
}: {
  era: Era
  eraIndex: number
  exploredClueIds: string[]
  gateOpen: boolean
  onExplore: (clue: ExplorationClue) => void
  onAdvance: () => void
  onIntroduce: () => void
}) => (
  <section className={`era-room era-room--${era.theme.key}`} style={themeStyle(era)}>
    <div className="era-room__atmosphere" aria-hidden="true">
      <span>{era.year}</span>
      <i />
      <i />
      <i />
    </div>

    <div className="era-room__heading">
      <p className="eyebrow">{era.chapter}</p>
      <p className="era-room__number">0{eraIndex + 1}</p>
      <h2>{era.shortTitle}</h2>
      <p className="era-room__full-title">{era.title}</p>
      <p className="era-room__intro">{era.intro}</p>
      <button className="era-room__introduction" onClick={onIntroduce} type="button">
        ABOUT THIS RECORD <span aria-hidden="true">↗</span>
      </button>
    </div>

    <div className="era-room__cover">
      <img alt={`${era.title} album cover`} src={era.coverUrl} />
      <span>OFFICIAL RELEASE ARTWORK / {era.year}</span>
    </div>

    <div className="era-room__clues">
      {era.clues.map((clue) => (
        <ClueObject
          clue={clue}
          explored={exploredClueIds.includes(clue.id)}
          key={clue.id}
          onExplore={onExplore}
        />
      ))}
    </div>

    <button
      className={`box-door ${gateOpen ? 'is-open' : ''}`}
      disabled={!gateOpen}
      onClick={onAdvance}
      type="button"
    >
      <i />
      <i />
      <span>{gateOpen ? (eraIndex === eras.length - 1 ? 'OPEN THE STAGE' : 'ENTER NEXT ERA') : `${exploredClueIds.length} / 2 CLUES`}</span>
    </button>
  </section>
)

const ERA_TRANSITION_SWAP_MS = 620
const ERA_TRANSITION_TOTAL_MS = 1350
const ERA_TRANSITION_REDUCED_SWAP_MS = 100
const ERA_TRANSITION_REDUCED_TOTAL_MS = 280

type EraTransitionRequest = {
  fromIndex: number
  toIndex: number
  mode: 'advance' | 'visit'
}

const EraTransition = ({
  fromEra,
  toEra,
  onComplete,
  onSwap,
  reducedMotion,
}: {
  fromEra: Era
  toEra: Era
  onComplete: () => void
  onSwap: () => void
  reducedMotion: boolean
}) => {
  useEffect(() => {
    const swapTimer = window.setTimeout(
      onSwap,
      reducedMotion ? ERA_TRANSITION_REDUCED_SWAP_MS : ERA_TRANSITION_SWAP_MS,
    )
    const completeTimer = window.setTimeout(
      onComplete,
      reducedMotion ? ERA_TRANSITION_REDUCED_TOTAL_MS : ERA_TRANSITION_TOTAL_MS,
    )

    return () => {
      window.clearTimeout(swapTimer)
      window.clearTimeout(completeTimer)
    }
  }, [onComplete, onSwap, reducedMotion])

  const style = {
    '--era-from-accent': fromEra.theme.accent,
    '--era-from-bg': fromEra.theme.background,
    '--era-to-accent': toEra.theme.accent,
    '--era-to-bg': toEra.theme.background,
  } as CSSProperties

  return (
    <div
      aria-hidden="true"
      className={`era-transition era-transition--${fromEra.theme.key}-to-${toEra.theme.key} ${reducedMotion ? 'is-reduced' : ''}`}
      style={style}
    >
      <div className="era-transition__wash" />
      <div className="era-transition__frames">
        <i />
        <i />
        <i />
      </div>
      <div className="era-transition__years">
        <span>{fromEra.year}</span>
        <i />
        <strong>{toEra.year}</strong>
      </div>
      <p>
        ROOM {String(eras.indexOf(fromEra) + 1).padStart(2, '0')} / ROOM{' '}
        {String(eras.indexOf(toEra) + 1).padStart(2, '0')}
      </p>
    </div>
  )
}

type TourPlaybackPhase = 'armed' | 'entering' | 'playing' | 'leaving'

const LIVE_ENTRANCE_MS = 1450
const LIVE_EXIT_MS = 760
const LIVE_CLOSING_QUOTE_MS = 7600
const LIVE_SKIP_SECONDS = 10

const formatVideoTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '0:00'
  }

  const totalSeconds = Math.floor(seconds)
  const minutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = totalSeconds % 60
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

const HouseSet = ({ scene }: { scene: TourScene }) => (
  <div className={`house-set house-set--${scene.visual}`} aria-hidden="true">
    <div className="house-set__roof">
      <i className="house-set__figure" />
    </div>
    <div className="house-set__frame">
      <div className="house-room house-room--bedroom"><i /></div>
      <div className="house-room house-room--hall"><i /></div>
      <div className="house-room house-room--stairs"><i /></div>
      <div className="house-room house-room--living">
        <i />
        <span className="house-room__tv" />
      </div>
      <div className="house-room house-room--study"><i /></div>
      <div className="house-room house-room--door"><i /></div>
    </div>
    <div className="house-set__grass">
      <i />
      <i />
      <i />
    </div>
  </div>
)

const STAGE_TRANSITION_MS = 8200
const STAGE_TRANSITION_REDUCED_MS = 700
const STAGE_TRANSITION_SKIP_DELAY_MS = 1000

const StageTransition = ({
  canSkip,
  onComplete,
  reducedMotion,
}: {
  canSkip: boolean
  onComplete: () => void
  reducedMotion: boolean
}) => {
  const [skipVisible, setSkipVisible] = useState(false)
  const completed = useRef(false)
  const finalEra = eras[eras.length - 1]!
  const openingScene = tourScenes[0]!

  const complete = useCallback(() => {
    if (completed.current) {
      return
    }

    completed.current = true
    onComplete()
  }, [onComplete])

  useEffect(() => {
    const completeTimer = window.setTimeout(
      complete,
      reducedMotion ? STAGE_TRANSITION_REDUCED_MS : STAGE_TRANSITION_MS,
    )
    const skipTimer = canSkip
      ? window.setTimeout(() => setSkipVisible(true), STAGE_TRANSITION_SKIP_DELAY_MS)
      : null

    return () => {
      window.clearTimeout(completeTimer)
      if (skipTimer) {
        window.clearTimeout(skipTimer)
      }
    }
  }, [canSkip, complete, reducedMotion])

  return (
    <section
      aria-label="From the album rooms to the live stage"
      className={`stage-transition ${reducedMotion ? 'is-reduced' : ''}`}
    >
      {appEnvironment.liveVideoProvider === 'local' ? (
        <video
          aria-hidden="true"
          className="stage-transition__preload"
          muted
          playsInline
          poster={openingScene.liveVideo.poster}
          preload="auto"
          src={openingScene.liveVideo.sources.high}
          tabIndex={-1}
        />
      ) : null}

      <div className="stage-transition__room" aria-hidden="true">
        <div className="stage-transition__copy">
          <p>{finalEra.chapter}</p>
          <span>05</span>
          <h2>{finalEra.shortTitle}</h2>
          <i>{finalEra.title}</i>
        </div>
        <div className="stage-transition__cover">
          <img alt="" src={finalEra.coverUrl} />
          <span>OFFICIAL RELEASE ARTWORK / 2022</span>
        </div>
        <div className="stage-transition__clues">
          {finalEra.clues.map((clue) => (
            <i key={clue.id}>{clue.kicker}</i>
          ))}
        </div>
      </div>

      <div className="stage-transition__years" aria-hidden="true">
        {eras.map((era, index) => (
          <span
            key={era.year}
            style={{ '--transition-accent': era.theme.accent, '--transition-index': index } as CSSProperties}
          >
            {era.year}
          </span>
        ))}
      </div>

      <div className="stage-transition__portal" aria-hidden="true">
        <i />
        <i />
        <i />
        <div className="stage-transition__preview">
          <p>VIRTUAL LIVE</p>
          <b>
            At Their
            <br />
            Very Best
          </b>
          <span>SEVEN ACTS / MSG</span>
        </div>
      </div>

      <div className="stage-transition__caption" aria-hidden="true">
        <p>FIVE ROOMS / ONE STAGE</p>
        <span>THE BOX WAS ALWAYS A DOOR.</span>
      </div>

      {canSkip && skipVisible ? (
        <button className="stage-transition__skip" onClick={complete} type="button">
          SKIP <i>↗</i>
        </button>
      ) : null}
    </section>
  )
}

const LivePrelude = ({ onEnter }: { onEnter: (tourIndex?: number) => void }) => {
  const openingScene = tourScenes[0]!

  return (
    <section aria-label="At Their Very Best live preview" className="live-prelude">
      {appEnvironment.liveVideoProvider === 'local' ? (
        <video
          aria-hidden="true"
          className="live-prelude__preload"
          muted
          playsInline
          poster={openingScene.liveVideo.poster}
          preload="auto"
          src={openingScene.liveVideo.sources.high}
          tabIndex={-1}
        />
      ) : null}
      <div className="live-prelude__rails" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="live-prelude__house" aria-hidden="true">
        <HouseSet scene={openingScene} />
      </div>
      <div className="live-prelude__copy">
        <p className="eyebrow">VIRTUAL LIVE / MADISON SQUARE GARDEN / SEVEN ACTS</p>
        <h2 className="live-prelude__sign" aria-label="At Their Very Best">
          <span>At Their</span>
          <span>Very Best</span>
        </h2>
        <p>
          The rooms have closed. The house is lit. This is the set you are about to step into.
        </p>
        <button autoFocus onClick={() => onEnter()} type="button">
          ENTER AT THEIR VERY BEST <i aria-hidden="true">↗</i>
        </button>
      </div>
      <div className="live-prelude__directory" aria-label="Virtual concert directory">
        <div>
          <span>SETLIST</span>
          <b>CLICK TO ENTER</b>
        </div>
        <ol>
          {tourScenes.map((scene, sceneIndex) => (
            <li key={scene.id}>
              <button
                aria-label={`Enter act ${scene.order}: ${scene.song}`}
                onClick={() => onEnter(sceneIndex)}
                type="button"
              >
                <i>{String(scene.order).padStart(2, '0')}</i>
                <span>{scene.song}</span>
                <b>{scene.albumYear}</b>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

const TourHouse = ({
  scene,
  onAdvance,
  onControlsVisibilityChange,
  onLivePlaybackChange,
  reducedMotion,
}: {
  scene: TourScene
  onAdvance: () => void
  onControlsVisibilityChange: (visible: boolean) => void
  onLivePlaybackChange: (active: boolean) => void
  reducedMotion: boolean
}) => {
  const initialVideoQuality = useMemo(() => {
    if (appEnvironment.fixedVideoQuality) {
      return appEnvironment.fixedVideoQuality
    }

    const connection = (navigator as Navigator & {
      connection?: { effectiveType?: string; saveData?: boolean }
    }).connection
    return chooseInitialVideoQuality(connection)
  }, [])
  const [phase, setPhase] = useState<TourPlaybackPhase>('armed')
  const [videoError, setVideoError] = useState(false)
  const [videoPaused, setVideoPaused] = useState(false)
  const [controlsLocked, setControlsLocked] = useState(false)
  const [controlsRevealed, setControlsRevealed] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isScrubbing, setIsScrubbing] = useState(false)
  const [scrubTime, setScrubTime] = useState(0)
  const [videoVolume, setVideoVolume] = useState(1)
  const [videoQuality, setVideoQuality] = useState<VideoQuality>(initialVideoQuality)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const videoVolumeRef = useRef(1)
  const isScrubbingRef = useRef(false)
  const entranceTimeout = useRef<number | null>(null)
  const exitTimeout = useRef<number | null>(null)
  const controlsRevealTimeout = useRef<number | null>(null)
  const pendingQualitySwitch = useRef<{ time: number; wasPaused: boolean } | null>(null)
  const entranceMs = reducedMotion ? 180 : LIVE_ENTRANCE_MS
  const exitMs = reducedMotion ? 180 : LIVE_EXIT_MS
  const closingQuoteMs = reducedMotion ? 2200 : LIVE_CLOSING_QUOTE_MS
  const usesEmbeddedVideo = appEnvironment.liveVideoProvider === 'bilibili' && Boolean(scene.liveVideo.embed)
  const fixedVideoQuality = appEnvironment.fixedVideoQuality

  const clearSceneTimers = useCallback(() => {
    if (entranceTimeout.current) {
      window.clearTimeout(entranceTimeout.current)
      entranceTimeout.current = null
    }

    if (exitTimeout.current) {
      window.clearTimeout(exitTimeout.current)
      exitTimeout.current = null
    }

    if (controlsRevealTimeout.current) {
      window.clearTimeout(controlsRevealTimeout.current)
      controlsRevealTimeout.current = null
    }
  }, [])

  useEffect(() => {
    clearSceneTimers()
    setPhase('armed')
    setVideoError(false)
    setVideoPaused(false)
    setControlsLocked(false)
    setControlsRevealed(false)
    setCurrentTime(0)
    setDuration(0)
    setIsScrubbing(false)
    setScrubTime(0)
    isScrubbingRef.current = false
    pendingQualitySwitch.current = null
    onControlsVisibilityChange(false)
    onLivePlaybackChange(false)

    const video = videoRef.current
    if (video) {
      video.pause()
      video.volume = videoVolumeRef.current
      try {
        video.currentTime = 0
      } catch {
        // Some browsers reject currentTime changes before metadata is ready.
      }
    }

    return () => {
      clearSceneTimers()
      onControlsVisibilityChange(false)
      onLivePlaybackChange(false)
    }
  }, [clearSceneTimers, onControlsVisibilityChange, onLivePlaybackChange, scene.id])

  const finishEntrance = useCallback(() => {
    entranceTimeout.current = null
    const video = videoRef.current

    if (usesEmbeddedVideo) {
      setVideoPaused(false)
      setPhase('playing')
      return
    }

    if (video && !videoError) {
      try {
        video.currentTime = 0
      } catch {
        // Keep the hidden warm-up playback if the browser cannot seek yet.
      }
      video.volume = videoVolumeRef.current
      void video.play().catch(() => {
        setVideoError(true)
        onLivePlaybackChange(false)
      })
    }

    setVideoPaused(false)
    setPhase('playing')
  }, [onLivePlaybackChange, usesEmbeddedVideo, videoError])

  const startLiveVideo = useCallback(() => {
    if (phase !== 'armed' || !scene.liveVideo.enabled) {
      return
    }

    clearSceneTimers()
    setVideoError(false)
    setVideoPaused(false)
    setPhase('entering')
    onLivePlaybackChange(true)

    const video = videoRef.current
    if (video && !usesEmbeddedVideo) {
      video.pause()
      video.volume = 0
      video.muted = false
      try {
        video.currentTime = 0
      } catch {
        // Metadata may not be ready; the later reset handles the visible start.
      }

      void video.play().catch(() => {
        clearSceneTimers()
        setVideoError(true)
        setPhase('playing')
        onLivePlaybackChange(false)
      })
    }

    entranceTimeout.current = window.setTimeout(finishEntrance, entranceMs)
  }, [clearSceneTimers, entranceMs, finishEntrance, onLivePlaybackChange, phase, scene.liveVideo.enabled, usesEmbeddedVideo])

  const finishLiveVideo = useCallback(() => {
    if (phase === 'leaving') {
      return
    }

    clearSceneTimers()
    setPhase('leaving')
    setControlsLocked(false)
    setControlsRevealed(false)
    onLivePlaybackChange(false)
    exitTimeout.current = window.setTimeout(onAdvance, scene.closingQuote ? closingQuoteMs : exitMs)
  }, [clearSceneTimers, closingQuoteMs, exitMs, onAdvance, onLivePlaybackChange, phase, scene.closingQuote])

  const toggleVideoPause = useCallback(() => {
    if (controlsLocked || phase !== 'playing') {
      return
    }

    const video = videoRef.current
    if (!video) {
      return
    }

    if (video.paused) {
      void video
        .play()
        .then(() => setVideoPaused(false))
        .catch(() => setVideoPaused(true))
      return
    }

    video.pause()
    setVideoPaused(true)
  }, [controlsLocked, phase])

  const seekVideo = useCallback(
    (value: number) => {
      if (controlsLocked || phase !== 'playing') {
        return
      }

      const video = videoRef.current
      if (!video || !Number.isFinite(value)) {
        return
      }

      const maxTime = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : duration
      const nextTime = Math.min(Math.max(value, 0), maxTime || value)
      try {
        video.currentTime = nextTime
        setCurrentTime(video.currentTime)
      } catch {
        setCurrentTime(video.currentTime)
      }
    },
    [controlsLocked, duration, phase],
  )

  const skipVideo = useCallback(
    (seconds: number) => {
      if (controlsLocked || phase !== 'playing') {
        return
      }

      const video = videoRef.current
      if (!video || !Number.isFinite(seconds)) {
        return
      }

      const maxTime = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : duration
      const nextTime = Math.min(Math.max(video.currentTime + seconds, 0), maxTime || video.currentTime + seconds)
      try {
        video.currentTime = nextTime
        setCurrentTime(video.currentTime)
      } catch {
        setCurrentTime(video.currentTime)
      }
    },
    [controlsLocked, duration, phase],
  )

  const exitLiveVideo = useCallback(() => {
    if (controlsLocked) {
      return
    }

    clearSceneTimers()
    const video = videoRef.current
    if (video) {
      video.pause()
      video.volume = videoVolumeRef.current
      try {
        video.currentTime = 0
      } catch {
        // Metadata may not be ready during a fast exit.
      }
    }

    setPhase('armed')
    setVideoError(false)
    setVideoPaused(false)
    setControlsLocked(false)
    setControlsRevealed(false)
    setCurrentTime(0)
    setIsScrubbing(false)
    setScrubTime(0)
    isScrubbingRef.current = false
    onLivePlaybackChange(false)
  }, [clearSceneTimers, controlsLocked, onLivePlaybackChange])

  const updateVideoProgress = useCallback(() => {
    const video = videoRef.current
    if (!video || isScrubbing || isScrubbingRef.current) {
      return
    }

    setCurrentTime(video.currentTime)
  }, [isScrubbing])

  const syncVideoProgress = useCallback(() => {
    const video = videoRef.current
    if (!video) {
      return
    }

    setCurrentTime(video.currentTime)
    setScrubTime(video.currentTime)
  }, [])

  const updateVideoDuration = useCallback(() => {
    const video = videoRef.current
    if (!video) {
      return
    }

    setDuration(Number.isFinite(video.duration) ? video.duration : 0)

    const pending = pendingQualitySwitch.current
    if (!pending) {
      return
    }

    pendingQualitySwitch.current = null
    video.volume = videoVolumeRef.current
    try {
      video.currentTime = Math.min(pending.time, video.duration || pending.time)
      setCurrentTime(video.currentTime)
      setScrubTime(video.currentTime)
    } catch {
      setCurrentTime(0)
      setScrubTime(0)
    }

    if (!pending.wasPaused) {
      void video.play().catch(() => setVideoPaused(true))
    }
  }, [])

  const changeVideoQuality = useCallback((quality: VideoQuality) => {
    if (fixedVideoQuality) {
      return
    }

    if (quality === videoQuality) {
      return
    }

    const video = videoRef.current
    if (video) {
      pendingQualitySwitch.current = {
        time: video.currentTime,
        wasPaused: video.paused,
      }
    }
    setVideoQuality(quality)
  }, [fixedVideoQuality, videoQuality])

  const changeVideoVolume = useCallback((value: number) => {
    if (!Number.isFinite(value)) {
      return
    }

    const nextVolume = Math.min(Math.max(value, 0), 1)
    videoVolumeRef.current = nextVolume
    setVideoVolume(nextVolume)

    const video = videoRef.current
    if (video) {
      video.volume = nextVolume
      video.muted = false
    }
  }, [])

  const controlsVisible = phase === 'playing' || (phase === 'leaving' && !scene.closingQuote)
  const localControlsVisible = controlsVisible && !usesEmbeddedVideo
  const progressMax = duration > 0 ? duration : 0
  const displayedTime = isScrubbing ? scrubTime : currentTime
  const progressValue = progressMax > 0 ? Math.min(displayedTime, progressMax) : 0
  const progressDisabled = controlsLocked || phase !== 'playing' || progressMax === 0
  const progressStyle = {
    '--live-progress': progressMax > 0 ? `${(progressValue / progressMax) * 100}%` : '0%',
  } as CSSProperties
  const volumeStyle = {
    '--volume-progress': `${videoVolume * 100}%`,
  } as CSSProperties

  const startVideoScrub = useCallback(() => {
    if (progressDisabled) {
      return
    }

    isScrubbingRef.current = true
    setIsScrubbing(true)
    setScrubTime(currentTime)
  }, [currentTime, progressDisabled])

  const scrubVideo = useCallback(
    (value: number) => {
      if (progressDisabled || !Number.isFinite(value)) {
        return
      }

      const nextTime = Math.min(Math.max(value, 0), progressMax)
      setScrubTime(nextTime)
      seekVideo(nextTime)
    },
    [progressDisabled, progressMax, seekVideo],
  )

  const finishVideoScrub = useCallback(() => {
    isScrubbingRef.current = false
    setIsScrubbing(false)
    syncVideoProgress()
  }, [syncVideoProgress])

  const revealVideoControls = useCallback(() => {
    if (!localControlsVisible || videoError) {
      return
    }

    if (controlsRevealTimeout.current) {
      window.clearTimeout(controlsRevealTimeout.current)
    }

    setControlsRevealed(true)
    controlsRevealTimeout.current = window.setTimeout(
      () => {
        if (!isScrubbingRef.current) {
          setControlsRevealed(false)
        }
      },
      controlsLocked ? 2800 : 2200,
    )
  }, [controlsLocked, localControlsVisible, videoError])

  const toggleControlsLock = useCallback(() => {
    const nextLocked = !controlsLocked
    if (controlsRevealTimeout.current) {
      window.clearTimeout(controlsRevealTimeout.current)
      controlsRevealTimeout.current = null
    }

    setControlsLocked(nextLocked)
    setControlsRevealed(true)

    if (!nextLocked) {
      controlsRevealTimeout.current = window.setTimeout(() => setControlsRevealed(false), 2200)
    }
  }, [controlsLocked])

  useEffect(() => {
    if (!localControlsVisible) {
      setControlsRevealed(false)
      return
    }

    revealVideoControls()
  }, [localControlsVisible, revealVideoControls, scene.id])

  useEffect(() => {
    onControlsVisibilityChange(localControlsVisible && controlsRevealed && !controlsLocked)
  }, [controlsLocked, controlsRevealed, localControlsVisible, onControlsVisibilityChange])

  const toggleVideoFromScreen = useCallback(() => {
    revealVideoControls()
    toggleVideoPause()
  }, [revealVideoControls, toggleVideoPause])

  useEffect(() => {
    if (!localControlsVisible || videoError) {
      return
    }

    const handlePlayerKey = (event: KeyboardEvent) => {
      const target = event.target
      const isTextEntry =
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLInputElement && target.type !== 'range')

      if (event.code === 'Space' && !isTextEntry) {
        event.preventDefault()
        revealVideoControls()
        toggleVideoPause()
        return
      }

      if (
        target instanceof HTMLElement &&
        (['BUTTON', 'SELECT', 'TEXTAREA'].includes(target.tagName) ||
          (target instanceof HTMLInputElement && target.type !== 'range'))
      ) {
        return
      }

      if (event.code === 'ArrowLeft') {
        if (target instanceof HTMLInputElement) {
          return
        }
        event.preventDefault()
        revealVideoControls()
        skipVideo(-LIVE_SKIP_SECONDS)
      }

      if (event.code === 'ArrowRight') {
        if (target instanceof HTMLInputElement) {
          return
        }
        event.preventDefault()
        revealVideoControls()
        skipVideo(LIVE_SKIP_SECONDS)
      }
    }

    window.addEventListener('keydown', handlePlayerKey)
    return () => window.removeEventListener('keydown', handlePlayerKey)
  }, [localControlsVisible, revealVideoControls, skipVideo, toggleVideoPause, videoError])

  return (
    <section
      className={[
        'tour-stage',
        `tour-stage--${scene.visual}`,
        `tour-stage--effect-${scene.entranceEffect}`,
        `tour-stage--phase-${phase}`,
        phase !== 'armed' ? 'is-activated' : '',
        localControlsVisible && !controlsRevealed && !controlsLocked ? 'tour-stage--controls-hidden' : '',
        usesEmbeddedVideo ? 'tour-stage--embedded-video' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onFocus={revealVideoControls}
      onMouseMove={revealVideoControls}
      onTouchStart={revealVideoControls}
    >
      {scene.liveVideo.enabled && !usesEmbeddedVideo ? (
        <video
          className="tour-stage__live-video"
          onClick={toggleVideoFromScreen}
          onEnded={finishLiveVideo}
          onLoadedMetadata={updateVideoDuration}
          onPause={() => setVideoPaused(true)}
          onPlay={() => setVideoPaused(false)}
          onSeeking={syncVideoProgress}
          onSeeked={syncVideoProgress}
          onTimeUpdate={updateVideoProgress}
          playsInline
          poster={scene.liveVideo.poster}
          preload="metadata"
          ref={videoRef}
          src={scene.liveVideo.sources[videoQuality]}
        />
      ) : null}
      {scene.liveVideo.enabled && usesEmbeddedVideo && scene.liveVideo.embed && (phase === 'playing' || phase === 'leaving') ? (
        <div className="tour-stage__embed-shell" aria-label={`${scene.song} Bilibili embedded player`}>
          <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            className="tour-stage__embed-player"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={scene.liveVideo.embed.src}
            title={`${scene.song} - Bilibili embedded player`}
          />
          <div className="tour-stage__embed-actions" aria-label="Embedded live navigation">
            <button onClick={exitLiveVideo} type="button">
              BACK TO ACT
            </button>
            <button onClick={finishLiveVideo} type="button">
              {scene.order === tourScenes.length ? 'FINISH THE NIGHT' : 'NEXT ACT'}
            </button>
          </div>
        </div>
      ) : null}
      <div className="tour-stage__effect" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <p className="eyebrow tour-stage__meta">
        AT THEIR VERY BEST / MSG / ACT {String(scene.order).padStart(2, '0')} / {scene.albumYear}
      </p>
      <HouseSet scene={scene} />
      <button
        autoFocus={scene.order === 1}
        className="tour-stage__interaction"
        disabled={phase !== 'armed'}
        onClick={startLiveVideo}
        type="button"
      >
        <span>{scene.triggerLabel}</span>
        <i>{phase === 'armed' ? 'READY' : 'LIVE'}</i>
      </button>
      <div className="tour-stage__panel">
        <p>{scene.subtitle}</p>
        <h2>{scene.title}</h2>
        <span>
          {scene.albumYear} / {scene.song}
        </span>
        <div className="tour-stage__tracklist" aria-label="MSG chapter tracks">
          {scene.tracks.map((track, index) => (
            <i key={track}>
              {String(index + 1).padStart(2, '0')} / {track}
            </i>
          ))}
        </div>
        <blockquote>{scene.copy}</blockquote>
        <span className="tour-stage__legacy-advance" hidden>
          {scene.order === tourScenes.length ? 'OPEN THE ARCHIVE' : 'NEXT ACT'} <i>↗</i>
        </span>
      </div>
      {videoError ? (
        <div className="tour-stage__fallback" role="status">
          <p>LIVE VIDEO UNAVAILABLE</p>
          <button onClick={finishLiveVideo} type="button">
            CONTINUE
          </button>
        </div>
      ) : null}
      {scene.closingQuote ? (
        <figure className="tour-stage__closing-quote" aria-hidden={phase !== 'leaving'}>
          <p>{scene.closingQuote.kicker}</p>
          <blockquote>
            {(scene.closingQuote.lines ?? [scene.closingQuote.body]).map((line, index) => (
              <span
                className={`tour-stage__closing-line tour-stage__closing-line--${index + 1}`}
                key={line}
              >
                {line}
              </span>
            ))}
          </blockquote>
          <figcaption>THE1975</figcaption>
        </figure>
      ) : null}
      {localControlsVisible && !videoError ? (
        <>
          <button
            aria-label={controlsLocked ? 'Unlock video controls' : 'Lock video controls'}
            className={[
              'tour-stage__lock-toggle',
              controlsLocked ? 'is-locked' : '',
              controlsRevealed || controlsLocked ? 'is-visible' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={toggleControlsLock}
            tabIndex={controlsRevealed || controlsLocked ? 0 : -1}
            type="button"
          >
            <i aria-hidden="true" />
          </button>
        <div
          aria-label="Live video controls"
          className={`tour-stage__controls ${controlsRevealed && !controlsLocked ? 'is-visible' : ''}`}
        >
          <label
            className={['tour-stage__scrub', progressDisabled ? 'is-disabled' : '']
              .filter(Boolean)
              .join(' ')}
            style={progressStyle}
          >
            <span className="sr-only">Live video progress</span>
            <span className="tour-stage__scrub-track" aria-hidden="true">
              <span className="tour-stage__scrub-fill" />
              <span className="tour-stage__scrub-thumb" />
            </span>
            <input
              aria-label="Live video progress"
              disabled={progressDisabled}
              max={progressMax || 0}
              min={0}
              onBlur={finishVideoScrub}
              onChange={(event) => scrubVideo(Number(event.currentTarget.value))}
              onInput={(event) => scrubVideo(Number(event.currentTarget.value))}
              onPointerCancel={finishVideoScrub}
              onPointerDown={startVideoScrub}
              onPointerUp={finishVideoScrub}
              step={0.05}
              type="range"
              value={progressValue}
            />
          </label>
          <div className="tour-stage__player-row">
            <div className="tour-stage__transport" aria-label="Transport controls">
              <button
                aria-label={videoPaused ? 'Play live video' : 'Pause live video'}
                className="tour-stage__transport-button"
                disabled={controlsLocked || !controlsRevealed || phase !== 'playing'}
                onClick={toggleVideoPause}
                type="button"
              >
                <i
                  aria-hidden="true"
                  className={videoPaused ? 'tour-stage__player-icon tour-stage__player-icon--play' : 'tour-stage__player-icon tour-stage__player-icon--pause'}
                />
              </button>
              <button
                aria-label="Exit live video"
                className="tour-stage__transport-button"
                disabled={controlsLocked || !controlsRevealed}
                onClick={exitLiveVideo}
                type="button"
              >
                <i aria-hidden="true" className="tour-stage__player-icon tour-stage__player-icon--stop" />
              </button>
              <button
                aria-label="Rewind 10 seconds"
                className="tour-stage__transport-button tour-stage__skip"
                disabled={controlsLocked || !controlsRevealed || phase !== 'playing'}
                onClick={() => skipVideo(-LIVE_SKIP_SECONDS)}
                type="button"
              >
                -10
              </button>
              <button
                aria-label="Forward 10 seconds"
                className="tour-stage__transport-button tour-stage__skip"
                disabled={controlsLocked || !controlsRevealed || phase !== 'playing'}
                onClick={() => skipVideo(LIVE_SKIP_SECONDS)}
                type="button"
              >
                +10
              </button>
              <button
                aria-label={scene.order === tourScenes.length ? 'Finish the night' : 'Next act'}
                className="tour-stage__transport-button tour-stage__next-act"
                disabled={controlsLocked || !controlsRevealed || phase !== 'playing'}
                onClick={finishLiveVideo}
                type="button"
              >
                {scene.order === tourScenes.length ? 'FINISH' : 'NEXT ACT'}
              </button>
            </div>
            <div className="tour-stage__readout">
              <span className="tour-stage__timecode">
                <b>{formatVideoTime(progressValue)}</b>
                <i>/</i>
                <span>{formatVideoTime(progressMax)}</span>
              </span>
              <span className="tour-stage__codec">S/W</span>
              <span className="tour-stage__codec">AVC1</span>
              <span className="tour-stage__codec">AAC</span>
              <span className="tour-stage__codec">2.0</span>
              <span className="tour-stage__quality" aria-label="Video quality">
                <button
                  aria-pressed={videoQuality === 'high'}
                  disabled={controlsLocked || !controlsRevealed || Boolean(fixedVideoQuality)}
                  onClick={() => changeVideoQuality('high')}
                  type="button"
                >1080P</button>
                {!fixedVideoQuality ? (
                  <button
                    aria-pressed={videoQuality === 'standard'}
                    disabled={controlsLocked || !controlsRevealed}
                    onClick={() => changeVideoQuality('standard')}
                    type="button"
                  >720P</button>
                ) : null}
              </span>
            </div>
            <label className="tour-stage__volume" style={volumeStyle}>
              <span aria-hidden="true" className="tour-stage__volume-icon" />
              <input
                aria-label="Live video volume"
                disabled={controlsLocked || !controlsRevealed}
                max={1}
                min={0}
                onChange={(event) => changeVideoVolume(Number(event.currentTarget.value))}
                onInput={(event) => changeVideoVolume(Number(event.currentTarget.value))}
                step={0.01}
                type="range"
                value={videoVolume}
              />
            </label>
          </div>
        </div>
        </>
      ) : null}
      <div className="tour-stage__progress" aria-label={`Tour progress ${scene.order} / ${tourScenes.length}`}>
        {tourScenes.map((item) => (
          <i className={item.order <= scene.order ? 'is-active' : ''} key={item.id} />
        ))}
      </div>
    </section>
  )
}

const ExperienceBack = ({
  avoidPlayer,
  concealed,
  label,
  onBack,
  phase,
}: {
  avoidPlayer?: boolean
  concealed?: boolean
  label: string
  onBack: () => void
  phase: ExperiencePhase
}) => (
  <button
    className={[
      'experience-back',
      phase === 'tour' ? 'experience-back--tour' : '',
      phase === 'archive' ? 'experience-back--archive' : '',
      avoidPlayer ? 'experience-back--above-player' : '',
      concealed ? 'is-concealed' : '',
    ]
      .filter(Boolean)
      .join(' ')}
    onClick={onBack}
    tabIndex={concealed ? -1 : 0}
    type="button"
  >
    <i>↗</i>
    <span>{label}</span>
  </button>
)

const ArchiveDrawer = ({
  selection,
  onClose,
}: {
  selection: ArchiveSelection
  onClose: () => void
}) => {
  const [copied, setCopied] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  const copyLink = async () => {
    const copiedLink = await copyText(createBrowserShareEnvironment(), window.location.href)
    if (copiedLink) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } else {
      setCopied(false)
    }
  }

  return (
    <aside className="archive-drawer" style={themeStyle(selection.era)} aria-modal="true" role="dialog">
      <button className="archive-drawer__close" onClick={onClose} ref={closeRef} type="button">
        CLOSE <i>×</i>
      </button>
      <div className="archive-drawer__grid">
        <div className="archive-drawer__meta">
          <p className="eyebrow">ARCHIVE NOTE / {selection.era.year}</p>
          <p>{selection.era.shortTitle}</p>
          <span>{selection.era.releaseDate}</span>
        </div>
        <div className="archive-drawer__cover">
          <img alt={`${selection.era.title} album cover`} src={selection.era.coverUrl} />
        </div>
        <div className="archive-drawer__content">
          <p className="archive-drawer__number">{selection.track.featured ? 'FOCUS TRACK' : 'ARCHIVE NOTE'}</p>
          <h2>{selection.track.title}</h2>
          <blockquote>{`"${selection.track.excerpt}"`}</blockquote>
          <p>{selection.track.note}</p>
          <div className="archive-drawer__actions">
            <ListenMenu track={selection.track} />
            <button onClick={copyLink} type="button">
              {copied ? 'LINK COPIED' : 'COPY LINK'}
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}

const Signature = ({
  profile,
  onSubmit,
}: {
  profile: FanProfile
  onSubmit: (profile: FanProfile) => void
}) => {
  const [name, setName] = useState(profile.anonymous ? '' : profile.name ?? '')

  const printName = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextName = name.trim().slice(0, 24)
    if (!nextName) {
      return
    }
    onSubmit({ name: nextName, anonymous: false })
  }

  return (
    <section className="signature-stage">
      <div className="signature-stage__frame" aria-hidden="true"><i /><i /><i /></div>
      <p className="eyebrow">AFTER SEVEN ACTS / ONE LAST MARK</p>
      <form className="signature-stage__form" onSubmit={printName}>
        <label htmlFor="fan-signature">WHO WAS HERE?</label>
        <input
          autoFocus
          id="fan-signature"
          maxLength={24}
          onChange={(event) => setName(event.currentTarget.value)}
          placeholder="YOUR NAME"
          value={name}
        />
        <p>Your name stays on this device. It is never uploaded.</p>
        <div className="signature-stage__actions">
          <button disabled={!name.trim()} type="submit">PRINT MY NAME</button>
          <button onClick={() => onSubmit({ name: null, anonymous: true })} type="button">
            STAY ANONYMOUS
          </button>
        </div>
      </form>
      <span className="signature-stage__number">1975</span>
    </section>
  )
}

const JourneyTicket = ({
  profile,
  ticket,
  onProfileChange,
}: {
  profile: FanProfile
  ticket: TicketData
  onProfileChange: (profile: FanProfile) => void
}) => {
  const reducedMotion = useReducedMotion()
  const [editing, setEditing] = useState(false)
  const [flipped, setFlipped] = useState(false)
  const [name, setName] = useState(profile.anonymous ? '' : profile.name ?? '')
  const [status, setStatus] = useState('')
  const downloadMenuRef = useRef<HTMLDetailsElement>(null)
  const fallbackTheme = ticketThemes.some(({ id }) => ticket.deepestEra.startsWith(id))
    ? ticket.deepestEra.slice(0, 4) as TicketThemeId
    : '2013'
  const [selectedThemeId, setSelectedThemeId] = useState<TicketThemeId>(
    () => loadTicketTheme(window.localStorage) ?? fallbackTheme,
  )
  const [hoveredThemeId, setHoveredThemeId] = useState<TicketThemeId | null>(null)
  const visibleThemeId = hoveredThemeId ?? selectedThemeId
  const theme = ticketThemes.find(({ id }) => id === visibleThemeId) ?? ticketThemes[0]
  const editionNumber = getTicketEditionNumber(ticket, visibleThemeId)

  useEffect(() => {
    setName(profile.anonymous ? '' : profile.name ?? '')
  }, [profile])

  const selectTheme = (themeId: TicketThemeId) => {
    setSelectedThemeId(themeId)
    setFlipped(false)
    try {
      saveTicketTheme(window.localStorage, themeId)
    } catch {
      // The selected edition remains active for this visit.
    }
  }

  const downloadTicket = async (side: 'front' | 'back' | 'both') => {
    const svg = side === 'front'
      ? createTicketSvg(ticket, selectedThemeId)
      : side === 'back'
        ? createTicketBackSvg(ticket, selectedThemeId)
        : createTicketKeepsakeSvg(ticket, selectedThemeId)
    const svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
    const image = new Image()

    try {
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve()
        image.onerror = () => reject(new Error('Ticket preview could not be rendered.'))
        image.src = svgUrl
      })

      const canvas = document.createElement('canvas')
      canvas.width = side === 'both' ? 1260 : 1200
      canvas.height = side === 'both' ? 1260 : 630
      const context = canvas.getContext('2d')
      if (!context) {
        throw new Error('Canvas is unavailable.')
      }
      context.drawImage(image, 0, 0)
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (!blob) {
        throw new Error('Ticket export failed.')
      }

      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `${ticket.journeyId}-${selectedThemeId}-${side}-ticket.png`
      link.href = downloadUrl
      link.click()
      URL.revokeObjectURL(downloadUrl)
      setStatus(`${side.toUpperCase()} KEPT`)
      if (downloadMenuRef.current) {
        downloadMenuRef.current.open = false
      }
    } catch {
      setStatus('EXPORT UNAVAILABLE')
    } finally {
      URL.revokeObjectURL(svgUrl)
    }
  }

  const tiltTicket = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (reducedMotion || event.pointerType !== 'mouse') {
      return
    }

    const bounds = event.currentTarget.getBoundingClientRect()
    const x = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width))
    const y = Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height))
    event.currentTarget.style.setProperty('--ticket-tilt-x', `${((0.5 - y) * 8).toFixed(2)}deg`)
    event.currentTarget.style.setProperty('--ticket-tilt-y', `${((x - 0.5) * 12).toFixed(2)}deg`)
    event.currentTarget.style.setProperty('--ticket-light-x', `${(x * 100).toFixed(1)}%`)
    event.currentTarget.style.setProperty('--ticket-light-y', `${(y * 100).toFixed(1)}%`)
  }

  const resetTicketTilt = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty('--ticket-tilt-x', '0deg')
    event.currentTarget.style.setProperty('--ticket-tilt-y', '0deg')
    event.currentTarget.style.setProperty('--ticket-light-x', '50%')
    event.currentTarget.style.setProperty('--ticket-light-y', '50%')
  }

  const saveName = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextName = name.trim().slice(0, 24)
    if (!nextName) {
      return
    }
    onProfileChange({ name: nextName, anonymous: false })
    setEditing(false)
  }

  return (
    <section
      className={`journey-ticket journey-ticket--${theme.id}`}
      aria-label="Your night ticket"
      style={{
        '--ticket-bg': theme.background,
        '--ticket-fg': theme.foreground,
        '--ticket-accent': theme.accent,
        '--ticket-muted': theme.muted,
      } as CSSProperties}
    >
      <div className="journey-ticket__chooser">
        <div>
          <p>CHOOSE YOUR EDITION</p>
          <span>HOVER TO PREVIEW / CLICK TO KEEP</span>
        </div>
        <div className="journey-ticket__themes" role="group" aria-label="Ticket edition">
          {ticketThemes.map((option) => (
            <button
              aria-label={`${option.id} ${option.label} ticket`}
              aria-pressed={selectedThemeId === option.id}
              className={selectedThemeId === option.id ? 'is-selected' : ''}
              key={option.id}
              onBlur={() => setHoveredThemeId(null)}
              onClick={() => selectTheme(option.id)}
              onFocus={() => setHoveredThemeId(option.id)}
              onMouseEnter={() => setHoveredThemeId(option.id)}
              onMouseLeave={() => setHoveredThemeId(null)}
              style={{
                '--option-bg': option.background,
                '--option-fg': option.foreground,
                '--option-accent': option.accent,
              } as CSSProperties}
              type="button"
            >
              <i aria-hidden="true"><b /><b /><b /></i>
              <span>{option.id}</span>
              <small>ED. {option.edition}</small>
            </button>
          ))}
        </div>
      </div>

      <div
        className={`journey-ticket__viewport ${flipped ? 'is-flipped' : ''}`}
        onPointerLeave={resetTicketTilt}
        onPointerMove={tiltTicket}
      >
        <div className="journey-ticket__tilt">
          <div className="journey-ticket__inner">
          <article className="journey-ticket__face journey-ticket__face--front">
            <div className="journey-ticket__decoration" aria-hidden="true"><i /><i /><i /><span>{theme.label}</span></div>
            <header>
              <p>THE 1975 / FIVE ROOMS / SEVEN ACTS</p>
              <span>{theme.id} / {theme.caption}</span>
            </header>
            <div className="journey-ticket__identity">
              <span>ADMIT ONE</span>
              <h3>{ticket.admitOne}</h3>
            </div>
            <dl>
              <div><dt>SIGNALS OPENED</dt><dd>{ticket.signalsOpened} / {ticket.signalsTotal}</dd></div>
              <div><dt>DEEPEST ROOM</dt><dd>{ticket.deepestEra}</dd></div>
              <div><dt>FINAL SONG</dt><dd>{ticket.finalSong}</dd></div>
              <div><dt>DATE / NUMBER</dt><dd>{ticket.completedDate} / {ticket.journeyId}</dd></div>
            </dl>
            <div className="journey-ticket__edition">{editionNumber}</div>
          </article>

          <article className="journey-ticket__face journey-ticket__face--back">
            <div className="journey-ticket__back-frame" aria-hidden="true"><i /><i /></div>
            <header>
              <p>{theme.id} / {theme.label} / REVERSE</p>
              <span>{editionNumber}</span>
            </header>
            <div className="journey-ticket__back-copy">
              <span>ARCHIVE NOTE / {theme.caption}</span>
              <h3>{theme.reverseTitle}</h3>
              <p>{theme.reverseNote}</p>
              <blockquote>{theme.reverseMark}</blockquote>
            </div>
            <footer>{ticket.admitOne} / {ticket.completedDate} / THE NIGHT YOU WERE HERE</footer>
          </article>
          </div>
        </div>
      </div>

      <div className="journey-ticket__actions">
        <button onClick={() => setFlipped((current) => !current)} type="button">
          {flipped ? 'RETURN TO FRONT' : 'TURN THE TICKET'}
        </button>
        <details className="journey-ticket__download" ref={downloadMenuRef}>
          <summary>KEEP THIS TICKET</summary>
          <div>
            <button onClick={() => downloadTicket('front')} type="button">FRONT</button>
            <button onClick={() => downloadTicket('back')} type="button">BACK</button>
            <button onClick={() => downloadTicket('both')} type="button">BOTH</button>
          </div>
        </details>
        <button onClick={() => setEditing(true)} type="button">EDIT NAME</button>
        <span aria-live="polite">{status}</span>
      </div>
      {editing ? (
        <form className="journey-ticket__edit" onSubmit={saveName}>
          <label htmlFor="ticket-name">NAME ON TICKET</label>
          <input
            autoFocus
            id="ticket-name"
            maxLength={24}
            onChange={(event) => setName(event.currentTarget.value)}
            value={name}
          />
          <button disabled={!name.trim()} type="submit">SAVE NAME</button>
          <button
            onClick={() => {
              onProfileChange({ name: null, anonymous: true })
              setEditing(false)
            }}
            type="button"
          >
            USE ANONYMOUS
          </button>
          <button onClick={() => setEditing(false)} type="button">CANCEL</button>
        </form>
      ) : null}
    </section>
  )
}

const Archive = ({
  onOpen,
  onProfileChange,
  onRestart,
  profile,
  ticket,
}: {
  onOpen: (era: Era, track: Track) => void
  onProfileChange: (profile: FanProfile) => void
  onRestart: () => void
  profile: FanProfile
  ticket: TicketData
}) => (
  <section className="archive-stage">
    <div className="archive-stage__intro">
      <div className="archive-stage__intro-heading">
        <p className="eyebrow">AFTER THE LAST ROOM / AFTER THE LAST LIGHT</p>
        <h2>
          THE ARCHIVE
          <br />
          STAYS OPEN.
        </h2>
        <p>五张专辑不是终点。你从某一首歌离开，也会从另一首歌回来。</p>
      </div>
      <blockquote className="archive-stage__quote">
        “You guys are the best thing<br />
        that ever happened to me”
      </blockquote>
      <span className="archive-stage__scroll-note">FIVE RECORDS / 2013—2022</span>
    </div>
    <JourneyTicket profile={profile} ticket={ticket} onProfileChange={onProfileChange} />
    <div className="archive-index">
      {eras.map((era, eraIndex) => (
        <section
          className="archive-index__era"
          key={era.year}
          style={{
            '--archive-accent': era.theme.accent,
            '--archive-cover': `url("${era.coverUrl}")`,
          } as CSSProperties}
        >
          <div className="archive-index__era-heading">
            <p>0{eraIndex + 1} / {era.year}</p>
            <h3>{era.shortTitle}</h3>
            <span>{era.title}</span>
          </div>
          <div
            aria-label={`${era.title} track listing`}
            className="archive-index__tracks"
            tabIndex={0}
          >
            <div className="archive-index__featured-tracks">
              {era.tracks.map((track, trackIndex) => (
                <button key={track.slug} onClick={() => onOpen(era, track)} type="button">
                  <i>{String(trackIndex + 1).padStart(2, '0')}</i>
                  <span>{track.title}</span>
                  <b aria-hidden="true">↗</b>
                </button>
              ))}
            </div>
            <div className="archive-index__catalog">
              <div className="archive-index__catalog-heading">
                <span>FULL ALBUM</span>
                <b>{era.tracklist.length} TRACKS</b>
              </div>
              <ol>
                {era.tracklist.map((title, trackIndex) => (
                  <li key={`${era.year}-${title}`}>
                    <i>{String(trackIndex + 1).padStart(2, '0')}</i>
                    <span>{title}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      ))}
    </div>
    <div className="archive-stage__footer">
      <button onClick={onRestart} type="button">
        RESTART THE JOURNEY
      </button>
      <div className="archive-stage__legal" aria-label="Fan work and privacy notice">
        <p>
          非官方、非商业粉丝纪念作品。The 1975、专辑封面、歌曲、演唱会影像与相关商标版权归各自权利人所有。
          本站不出售门票、周边或音视频内容，不用于广告变现。
        </p>
        <p>
          If you are a rights holder and want any credited material removed or replaced, contact the site owner through the public repository or release channel; it will be taken down promptly.
          Nicknames and journey progress stay in this browser only.
        </p>
      </div>
      <div className="archive-stage__credits">
        {assetCredits.map((credit) => (
          <a href={credit.source} key={credit.label} rel="noreferrer" target={credit.source.startsWith('http') ? '_blank' : undefined}>
            {credit.label}
          </a>
        ))}
      </div>
    </div>
  </section>
)

export const App = () => {
  const initialSelection = useMemo(() => getArchiveSelection(window.location.hash), [])
  const [experience, dispatch] = useReducer(
    experienceReducer,
    undefined,
    () => {
      const restored = loadJourney(window.localStorage) ?? createInitialExperience()
      return initialSelection
        ? experienceReducer(restored, { type: 'SKIP_TO_ARCHIVE' })
        : restored
    },
  )
  const [selection, setSelection] = useState<ArchiveSelection | null>(initialSelection)
  const [activeClue, setActiveClue] = useState<ExplorationClue | null>(null)
  const [introductionEra, setIntroductionEra] = useState<Era | null>(null)
  const [eraTransition, setEraTransition] = useState<EraTransitionRequest | null>(null)
  const [fanProfile, setFanProfile] = useState<FanProfile>(() => loadFanProfile(window.localStorage))
  const [liveVideoActive, setLiveVideoActive] = useState(false)
  const [liveControlsVisible, setLiveControlsVisible] = useState(false)
  const reducedMotion = useReducedMotion()
  const activeEra = eras[experience.activeEraIndex]
  const activeTourScene = tourScenes[experience.activeTourIndex]
  const exploredClueIds = experience.exploredClues[activeEra.year] ?? []
  const gateOpen = isEraGateOpen(experience)
  const ticket = useMemo(
    () => deriveTicketData(experience, fanProfile, eras),
    [experience, fanProfile],
  )
  const backLabel =
    experience.phase === 'archive'
      ? 'BACK TO AFTERGLOW'
      : experience.phase === 'livePrelude'
        ? 'BACK TO BFIAFL'
        : experience.phase === 'tour'
        ? experience.activeTourIndex === 0
          ? 'BACK TO LIVE PREVIEW'
          : 'PREVIOUS ACT'
        : experience.phase === 'eras'
          ? experience.activeEraIndex === 0
            ? 'BACK TO ENTRANCE'
            : 'PREVIOUS ROOM'
          : ''
  const canGoBack = experience.hasCompletedFirstRun && backLabel.length > 0

  const openArchive = useCallback((era: Era, track: Track) => {
    window.history.pushState(null, '', buildArchiveHash(era.year, track.slug))
    setSelection({ era, track })
  }, [])

  const closeArchive = useCallback(() => {
    window.history.pushState(null, '', `${window.location.pathname}${window.location.search}`)
    setSelection(null)
  }, [])

  useEffect(() => {
    const syncHash = () => {
      const nextSelection = getArchiveSelection(window.location.hash)
      if (nextSelection) {
        dispatch({ type: 'SKIP_TO_ARCHIVE' })
        setSelection(nextSelection)
      }
    }
    window.addEventListener('hashchange', syncHash)
    return () => window.removeEventListener('hashchange', syncHash)
  }, [])

  useEffect(() => {
    try {
      saveJourney(window.localStorage, experience)
    } catch {
      // The experience remains usable when browser storage is unavailable.
    }
  }, [experience])

  useEffect(() => {
    try {
      saveFanProfile(window.localStorage, fanProfile)
    } catch {
      // The profile is optional and remains in memory for this visit.
    }
  }, [fanProfile])

  useEffect(() => {
    if (!selection) {
      return
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeArchive()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [closeArchive, selection])

  useEffect(() => {
    setLiveVideoActive(false)
    setLiveControlsVisible(false)
  }, [experience.activeTourIndex, experience.phase, appEnvironment.liveVideoProvider])

  useEffect(() => {
    if (appEnvironment.liveVideoProvider !== 'local') {
      return
    }

    if (experience.phase !== 'tour' && experience.phase !== 'livePrelude') {
      return
    }

    const nextVideo = experience.phase === 'livePrelude'
      ? tourScenes[0]?.liveVideo
      : tourScenes[experience.activeTourIndex + 1]?.liveVideo
    if (!nextVideo?.enabled) {
      return
    }

    const preload = document.createElement('video')
    preload.preload = 'metadata'
    preload.src = nextVideo.sources.high

    return () => {
      preload.removeAttribute('src')
      preload.load()
    }
  }, [experience.activeTourIndex, experience.phase])

  const enterExperience = () => {
    dispatch({ type: 'ENTER_EXPERIENCE' })
  }

  const exploreClue = (clue: ExplorationClue) => {
    dispatch({ type: 'EXPLORE_CLUE', clueId: clue.id })
    setActiveClue(clue)
  }

  const submitSignature = (profile: FanProfile) => {
    setFanProfile(profile)
    dispatch({ type: 'SUBMIT_SIGNATURE' })
  }

  const goBack = () => {
    setActiveClue(null)
    setIntroductionEra(null)
    if (selection) {
      closeArchive()
    }
    dispatch({ type: 'GO_BACK' })
  }

  const beginEraTransition = useCallback(
    (toIndex: number, mode: EraTransitionRequest['mode']) => {
      if (eraTransition || toIndex === experience.activeEraIndex) {
        return
      }

      setActiveClue(null)
      setIntroductionEra(null)
      setEraTransition({
        fromIndex: experience.activeEraIndex,
        toIndex,
        mode,
      })
    },
    [eraTransition, experience.activeEraIndex],
  )

  const swapEraTransition = useCallback(() => {
    if (!eraTransition) {
      return
    }

    dispatch(
      eraTransition.mode === 'advance'
        ? { type: 'ADVANCE_ERA' }
        : { type: 'VISIT_ERA', eraIndex: eraTransition.toIndex },
    )
  }, [eraTransition])

  const completeEraTransition = useCallback(() => {
    setEraTransition(null)
  }, [])

  return (
    <main className="experience">
      {experience.phase === 'prologue' ? (
        <Prologue
          onEnter={enterExperience}
          onSkip={() => dispatch({ type: 'SKIP_TO_ARCHIVE' })}
          reducedMotion={reducedMotion}
        />
      ) : null}

      {experience.phase === 'eras' ? (
        <div className="rooms-stage" style={themeStyle(activeEra)}>
          <LayerStack
            activeEraIndex={experience.activeEraIndex}
            unlockedEraIndexes={experience.unlockedEraIndexes}
          />
          <AlbumShelf
            activeEraIndex={experience.activeEraIndex}
            onVisit={(eraIndex) => {
              beginEraTransition(eraIndex, 'visit')
            }}
            unlockedEraIndexes={experience.unlockedEraIndexes}
          />
          <EraRoom
            era={activeEra}
            eraIndex={experience.activeEraIndex}
            exploredClueIds={exploredClueIds}
            gateOpen={gateOpen}
            onAdvance={() => {
              if (experience.activeEraIndex >= eras.length - 1) {
                setActiveClue(null)
                dispatch({ type: 'ADVANCE_ERA' })
                return
              }

              beginEraTransition(experience.activeEraIndex + 1, 'advance')
            }}
            onExplore={exploreClue}
            onIntroduce={() => {
              setActiveClue(null)
              setIntroductionEra(activeEra)
            }}
          />
          {activeClue ? <CluePanel clue={activeClue} onClose={() => setActiveClue(null)} /> : null}
          {introductionEra ? (
            <AlbumIntroduction era={introductionEra} onClose={() => setIntroductionEra(null)} />
          ) : null}
          {eraTransition ? (
            <EraTransition
              fromEra={eras[eraTransition.fromIndex]!}
              onComplete={completeEraTransition}
              onSwap={swapEraTransition}
              reducedMotion={reducedMotion}
              toEra={eras[eraTransition.toIndex]!}
            />
          ) : null}
        </div>
      ) : null}

      {experience.phase === 'tour' ? (
        <TourHouse
          onAdvance={() => dispatch({ type: 'ADVANCE_TOUR', completedAt: new Date().toISOString() })}
          onControlsVisibilityChange={setLiveControlsVisible}
          onLivePlaybackChange={setLiveVideoActive}
          reducedMotion={reducedMotion}
          scene={activeTourScene}
        />
      ) : null}

      {experience.phase === 'livePrelude' ? (
        <LivePrelude onEnter={(tourIndex) => dispatch({ type: 'ENTER_TOUR', tourIndex })} />
      ) : null}

      {experience.phase === 'interlude' ? (
        <StageTransition
          canSkip={experience.hasCompletedFirstRun}
          onComplete={() => dispatch({ type: 'ENTER_LIVE_PRELUDE' })}
          reducedMotion={reducedMotion}
        />
      ) : null}

      {experience.phase === 'signature' ? (
        <Signature profile={fanProfile} onSubmit={submitSignature} />
      ) : null}

      {experience.phase === 'archive' ? (
        <Archive
          onOpen={openArchive}
          onProfileChange={setFanProfile}
          onRestart={() => {
            closeArchive()
            dispatch({ type: 'RESTART_EXPERIENCE', journeyId: createJourneyId() })
          }}
          profile={fanProfile}
          ticket={ticket}
        />
      ) : null}

      {canGoBack && !eraTransition && !introductionEra ? (
        <ExperienceBack
          avoidPlayer={liveVideoActive}
          concealed={liveVideoActive && !liveControlsVisible}
          label={backLabel}
          onBack={goBack}
          phase={experience.phase}
        />
      ) : null}

      {selection ? <ArchiveDrawer onClose={closeArchive} selection={selection} /> : null}
    </main>
  )
}
