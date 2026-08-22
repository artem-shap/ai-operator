import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  BackHandler,
  Dimensions,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';

/* ================================================================== */
/*  Theme                                                              */
/* ================================================================== */
type Palette = typeof DARK;

const DARK = {
  dark: true,
  backdrop: '#050507',
  bg: '#08080A',
  bgElevated: '#0C0C10',
  surface: 'rgba(255,255,255,0.03)',
  surfaceHi: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.08)',
  borderHi: 'rgba(255,255,255,0.14)',
  text: '#F4F4F6',
  dim: '#A2A2AD',
  faint: '#6A6A77',
  accent: '#9182FF',
  accentSolid: '#7C5CFF',
  ctaA: '#8E72FF',
  ctaB: '#7C5CFF',
  onCta: '#FFFFFF',
};

const LIGHT: Palette = {
  dark: false,
  backdrop: '#E7E7EC',
  bg: '#FBFBFD',
  bgElevated: '#FFFFFF',
  surface: 'rgba(10,10,20,0.025)',
  surfaceHi: 'rgba(10,10,20,0.05)',
  border: 'rgba(10,10,20,0.10)',
  borderHi: 'rgba(10,10,20,0.18)',
  text: '#15151C',
  dim: '#56565F',
  faint: '#9A9AA6',
  accent: '#6A48FF',
  accentSolid: '#6A48FF',
  ctaA: '#7C5CFF',
  ctaB: '#6A48FF',
  onCta: '#FFFFFF',
};

const F = {
  reg: 'Inter_400Regular',
  med: 'Inter_500Medium',
  semi: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  mono: 'JetBrainsMono_500Medium',
};

const { width: WIN_W, height: WIN_H } = Dimensions.get('window');
const IS_WEB = Platform.OS === 'web';
const SCREEN_W = IS_WEB ? Math.min(WIN_W, 440) : WIN_W;
const GUTTER = 20;
const TOP_INSET = IS_WEB ? 22 : Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) + 6 : 58;

const ThemeCtx = createContext<{ p: Palette; styles: ReturnType<typeof makeStyles>; toggle: () => void }>({
  p: DARK,
  styles: makeStyles(DARK),
  toggle: () => {},
});
const useTheme = () => useContext(ThemeCtx);

/* ================================================================== */
/*  Data                                                               */
/* ================================================================== */
type IconName = keyof typeof Ionicons.glyphMap;
type Tool = {
  id: string;
  name: string;
  tagline: string;
  category: string;
  pricing: string;
  platform: string;
  color: string;
  icon: IconName;
  featured?: boolean;
  description: string;
  bestFor: string[];
  url: string;
};

const TOOLS: Tool[] = [
  {
    id: 'claude',
    name: 'Claude',
    tagline: 'Frontier AI assistant for writing & code',
    category: 'AI',
    pricing: 'Free + Pro',
    platform: 'Web · API',
    color: '#D9774E',
    icon: 'sparkles',
    featured: true,
    description:
      'Claude is a frontier AI assistant from Anthropic built for long-form reasoning, writing, and coding. It handles large context windows and nuanced instructions with a calm, reliable tone.',
    bestFor: [
      'Drafting and editing long-form content',
      'Pair-programming and code review',
      'Research synthesis across many documents',
    ],
    url: 'https://claude.ai',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    tagline: 'The AI-native code editor',
    category: 'Development',
    pricing: 'Free + Pro',
    platform: 'Desktop',
    color: '#5B8DEF',
    icon: 'code-slash',
    featured: true,
    description:
      'Cursor is an AI-native code editor that understands your whole codebase. It edits across files, answers questions in context, and turns plain-English intent into working diffs.',
    bestFor: [
      'Shipping features faster with AI edits',
      'Refactoring across large codebases',
      'Learning unfamiliar repositories quickly',
    ],
    url: 'https://cursor.com',
  },
  {
    id: 'vercel',
    name: 'Vercel',
    tagline: 'Ship and scale modern web apps',
    category: 'Infrastructure',
    pricing: 'Free + Paid',
    platform: 'Cloud',
    color: '#4EC2B8',
    icon: 'rocket',
    description:
      'Vercel is the deployment platform for modern web apps. Push to git and get instant global delivery, preview URLs for every branch, and zero-config hosting for frameworks like Next.js and Astro.',
    bestFor: [
      'Instant, zero-config deployments',
      'Preview links for every pull request',
      'Edge performance out of the box',
    ],
    url: 'https://vercel.com',
  },
  {
    id: 'beehiiv',
    name: 'Beehiiv',
    tagline: 'Grow and monetize a newsletter',
    category: 'Audience',
    pricing: 'Free + Paid',
    platform: 'Web',
    color: '#F4C53F',
    icon: 'mail',
    description:
      'Beehiiv is a newsletter platform built by the team behind Morning Brew. It pairs a clean writing experience with growth tools, segmentation, and built-in monetization.',
    bestFor: [
      'Launching and scaling a newsletter',
      'Growing subscribers with referrals',
      'Monetizing an audience directly',
    ],
    url: 'https://www.beehiiv.com',
  },
  {
    id: 'notion',
    name: 'Notion',
    tagline: 'All-in-one docs & databases',
    category: 'Productivity',
    pricing: 'Free + Paid',
    platform: 'Web · Apps',
    color: '#C8CAD0',
    icon: 'document-text',
    description:
      'Notion is an all-in-one workspace combining docs, databases, and wikis. Solopreneurs use it as a single source of truth for projects, content calendars, and knowledge.',
    bestFor: [
      'Organizing projects and notes',
      'Building lightweight databases',
      'Sharing docs with clients',
    ],
    url: 'https://www.notion.so',
  },
  {
    id: 'framer',
    name: 'Framer',
    tagline: 'Design and publish sites, no code',
    category: 'Design',
    pricing: 'Free + Paid',
    platform: 'Web',
    color: '#3AA0F2',
    icon: 'color-palette',
    description:
      'Framer lets you design and publish responsive websites without code. It blends a visual canvas with real CMS and animation, so a polished marketing site can go live in hours.',
    bestFor: [
      'Designing landing pages visually',
      'Publishing sites without a developer',
      'Rich scroll and hover animations',
    ],
    url: 'https://www.framer.com',
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    tagline: 'High-fidelity image generation',
    category: 'Creative',
    pricing: 'Paid',
    platform: 'Web · Discord',
    color: '#8B7BF0',
    icon: 'image',
    description:
      'Midjourney generates striking, high-fidelity images from text prompts. It is a go-to for brand visuals, mood boards, and concept art with a distinctive aesthetic edge.',
    bestFor: [
      'Brand and marketing visuals',
      'Mood boards and concept art',
      'Fast iteration on creative ideas',
    ],
    url: 'https://www.midjourney.com',
  },
  {
    id: 'make',
    name: 'Make.com',
    tagline: 'Visual automation for your stack',
    category: 'Automation',
    pricing: 'Free + Paid',
    platform: 'Web',
    color: '#B36BF6',
    icon: 'flash',
    description:
      'Make is a visual automation platform that connects your apps into powerful workflows. Drag, drop, and link services to remove repetitive manual work without writing code.',
    bestFor: [
      'Automating repetitive busywork',
      'Connecting apps without code',
      'Building multi-step workflows',
    ],
    url: 'https://www.make.com',
  },
];

const CATEGORIES = ['All', 'Saved', ...Array.from(new Set(TOOLS.map((t) => t.category)))];

/* ================================================================== */
/*  Utilities                                                          */
/* ================================================================== */
function useReduceMotion() {
  const [rm, setRm] = useState(false);
  useEffect(() => {
    let on = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => on && setRm(v));
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setRm);
    return () => {
      on = false;
      // @ts-ignore
      sub?.remove?.();
    };
  }, []);
  return rm;
}

const tapHaptic = () => {
  if (IS_WEB) return;
  Haptics.selectionAsync().catch(() => {});
};
const lightHaptic = () => {
  if (IS_WEB) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};
const successHaptic = () => {
  if (IS_WEB) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
};

function Rise({
  index = 0,
  disabled,
  style,
  children,
}: {
  index?: number;
  disabled: boolean;
  style?: any;
  children: React.ReactNode;
}) {
  const v = useRef(new Animated.Value(disabled ? 1 : 0)).current;
  useEffect(() => {
    if (disabled) {
      v.setValue(1);
      return;
    }
    Animated.timing(v, {
      toValue: 1,
      duration: 460,
      delay: Math.min(index, 9) * 52,
      useNativeDriver: true,
    }).start();
  }, [disabled]);
  return (
    <Animated.View
      style={[
        style,
        { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

function PressScale({
  onPress,
  children,
  style,
  accessibilityLabel,
  hitSlop,
  amount = 0.97,
}: {
  onPress: () => void;
  children: React.ReactNode;
  style?: any;
  accessibilityLabel?: string;
  hitSlop?: number;
  amount?: number;
}) {
  const s = useRef(new Animated.Value(1)).current;
  const to = (v: number) =>
    Animated.spring(s, { toValue: v, useNativeDriver: true, speed: 45, bounciness: 5 }).start();
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => to(amount)}
      onPressOut={() => to(1)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={hitSlop}
    >
      <Animated.View style={[style, { transform: [{ scale: s }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

function BrandMark({ size = 30 }: { size?: number }) {
  const { p } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: p.dark ? 'rgba(124,92,255,0.16)' : 'rgba(106,72,255,0.12)',
        borderWidth: 1,
        borderColor: p.dark ? 'rgba(124,92,255,0.3)' : 'rgba(106,72,255,0.28)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name="chevron-forward" size={size * 0.5} color={p.accent} />
    </View>
  );
}

/* ================================================================== */
/*  Featured card                                                      */
/* ================================================================== */
function FeaturedCard({ tool, onPress }: { tool: Tool; onPress: () => void }) {
  const { p, styles } = useTheme();
  return (
    <PressScale
      onPress={onPress}
      accessibilityLabel={`${tool.name}, featured. ${tool.tagline}`}
      style={[styles.featCard, { width: SCREEN_W * 0.72 }]}
    >
      <LinearGradient
        colors={[tool.color + (p.dark ? '2E' : '26'), 'rgba(255,255,255,0.0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.featTopRow}>
        <View style={[styles.iconTile, { backgroundColor: tool.color + '24' }]}>
          <Ionicons name={tool.icon} size={24} color={tool.color} />
        </View>
        <View style={styles.featTag}>
          <Ionicons name="star" size={10} color={p.accent} />
          <Text style={styles.featTagText}>FEATURED</Text>
        </View>
      </View>
      <Text style={styles.featName}>{tool.name}</Text>
      <Text style={styles.featTagline} numberOfLines={2}>
        {tool.tagline}
      </Text>
      <View style={styles.featFoot}>
        <Text style={styles.metaMono}>{tool.category.toUpperCase()}</Text>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.metaMono}>{tool.pricing}</Text>
      </View>
    </PressScale>
  );
}

/* ================================================================== */
/*  Tool row                                                           */
/* ================================================================== */
function ToolRow({
  tool,
  saved,
  onPress,
  onToggleSave,
  index,
  reduceMotion,
}: {
  tool: Tool;
  saved: boolean;
  onPress: () => void;
  onToggleSave: () => void;
  index: number;
  reduceMotion: boolean;
}) {
  const { p, styles } = useTheme();
  const s = useRef(new Animated.Value(1)).current;
  const to = (v: number) =>
    Animated.spring(s, { toValue: v, useNativeDriver: true, speed: 45, bounciness: 4 }).start();
  return (
    <Rise index={index} disabled={reduceMotion}>
      <Pressable
        onPress={onPress}
        onPressIn={() => to(0.985)}
        onPressOut={() => to(1)}
        accessibilityRole="button"
        accessibilityLabel={`${tool.name}. ${tool.tagline}`}
      >
        <Animated.View style={[styles.row, { transform: [{ scale: s }] }]}>
          <View style={[styles.iconTile, { backgroundColor: tool.color + '22' }]}>
            <Ionicons name={tool.icon} size={22} color={tool.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowName}>{tool.name}</Text>
            <Text style={styles.rowTagline} numberOfLines={1}>
              {tool.tagline}
            </Text>
          </View>
          <Pressable
            onPress={onToggleSave}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={saved ? `Remove ${tool.name} from saved` : `Save ${tool.name}`}
            style={styles.saveBtn}
          >
            <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={18} color={saved ? p.accent : p.faint} />
          </Pressable>
          <Ionicons name="chevron-forward" size={18} color={p.faint} />
        </Animated.View>
      </Pressable>
    </Rise>
  );
}

/* ================================================================== */
/*  Home                                                               */
/* ================================================================== */
function HomeScreen({
  onSelect,
  onAbout,
  saved,
  toggleSave,
  reduceMotion,
}: {
  onSelect: (t: Tool) => void;
  onAbout: () => void;
  saved: Set<string>;
  toggleSave: (id: string) => void;
  reduceMotion: boolean;
}) {
  const { p, styles, toggle } = useTheme();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('All');
  const scrollY = useRef(new Animated.Value(0)).current;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOOLS.filter((t) => {
      const matchCat = cat === 'All' ? true : cat === 'Saved' ? saved.has(t.id) : t.category === cat;
      const matchQ =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.tagline.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [query, cat, saved]);

  const showFeatured = cat === 'All' && query.trim() === '';
  const featured = TOOLS.filter((t) => t.featured);
  const compactOpacity = scrollY.interpolate({ inputRange: [44, 96], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <View style={{ flex: 1 }}>
      <Animated.View pointerEvents="none" style={[styles.compactBar, { opacity: compactOpacity }]}>
        <BrandMark size={26} />
        <Text style={styles.compactTitle}>AI Operator</Text>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.brandRow}>
              <BrandMark size={32} />
              <Text style={styles.kicker}>THE AI OPERATOR</Text>
            </View>
            <View style={styles.headerBtns}>
              <Pressable
                onPress={() => {
                  tapHaptic();
                  toggle();
                }}
                style={styles.headerIcon}
                accessibilityRole="button"
                accessibilityLabel="Toggle theme"
                hitSlop={8}
              >
                <Ionicons name={p.dark ? 'sunny-outline' : 'moon-outline'} size={16} color={p.text} />
              </Pressable>
              <Pressable
                onPress={() => {
                  tapHaptic();
                  onAbout();
                }}
                style={styles.headerIcon}
                accessibilityRole="button"
                accessibilityLabel="About"
                hitSlop={8}
              >
                <Ionicons name="information-circle-outline" size={18} color={p.text} />
              </Pressable>
            </View>
          </View>
          <Text style={styles.title}>Curated AI stack</Text>
          <Text style={styles.subtitle}>A hand-picked directory of tools solopreneurs actually ship with.</Text>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={17} color={p.faint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search tools, categories…"
            placeholderTextColor={p.faint}
            style={styles.searchInput}
            selectionColor={p.accent}
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={17} color={p.faint} />
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          keyboardShouldPersistTaps="handled"
        >
          {CATEGORIES.map((c) => {
            const active = c === cat;
            return (
              <Pressable
                key={c}
                onPress={() => {
                  tapHaptic();
                  setCat(c);
                }}
                style={[styles.chip, active && styles.chipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                {c === 'Saved' && (
                  <Ionicons name="bookmark" size={11} color={active ? p.bg : p.dim} style={{ marginRight: 5 }} />
                )}
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {showFeatured && (
          <View style={{ marginTop: 26 }}>
            <Text style={styles.sectionLabel}>FEATURED</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: GUTTER, gap: 12 }}
              decelerationRate="fast"
              snapToInterval={SCREEN_W * 0.72 + 12}
            >
              {featured.map((t) => (
                <FeaturedCard key={t.id} tool={t} onPress={() => onSelect(t)} />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.listHead}>
          <Text style={styles.sectionLabel}>{cat === 'All' && !query ? 'ALL TOOLS' : 'RESULTS'}</Text>
          <Text style={styles.countMono}>
            {filtered.length} {filtered.length === 1 ? 'tool' : 'tools'}
          </Text>
        </View>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="search" size={22} color={p.faint} />
            </View>
            <Text style={styles.emptyTitle}>No tools found</Text>
            <Text style={styles.emptyText}>Nothing matches “{query || cat}”. Try another search or category.</Text>
            <PressScale
              onPress={() => {
                setQuery('');
                setCat('All');
              }}
              style={styles.emptyBtn}
              accessibilityLabel="Reset filters"
            >
              <Text style={styles.emptyBtnText}>Reset</Text>
            </PressScale>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map((t, i) => (
              <ToolRow
                key={t.id}
                tool={t}
                index={i}
                reduceMotion={reduceMotion}
                saved={saved.has(t.id)}
                onPress={() => {
                  tapHaptic();
                  onSelect(t);
                }}
                onToggleSave={() => {
                  lightHaptic();
                  toggleSave(t.id);
                }}
              />
            ))}
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
}

/* ================================================================== */
/*  Detail                                                             */
/* ================================================================== */
function DetailScreen({
  tool,
  onBack,
  saved,
  toggleSave,
  reduceMotion,
}: {
  tool: Tool;
  onBack: () => void;
  saved: boolean;
  toggleSave: () => void;
  reduceMotion: boolean;
}) {
  const { p, styles } = useTheme();
  const anim = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) anim.setValue(1);
    else {
      anim.setValue(0);
      Animated.timing(anim, { toValue: 1, duration: 380, useNativeDriver: true }).start();
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [tool.id]);

  const animStyle = {
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  };
  const facts = [
    { label: 'CATEGORY', value: tool.category },
    { label: 'PRICING', value: tool.pricing },
    { label: 'PLATFORM', value: tool.platform },
  ];
  const onShare = () => {
    lightHaptic();
    Share.share({ message: `${tool.name} — ${tool.tagline}\n${tool.url}` }).catch(() => {});
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.navBar}>
        <PressScale onPress={onBack} style={styles.iconBtn} accessibilityLabel="Go back" hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color={p.text} />
        </PressScale>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <PressScale
            onPress={() => {
              lightHaptic();
              toggleSave();
            }}
            style={styles.iconBtn}
            accessibilityLabel={saved ? 'Remove from saved' : 'Save tool'}
            hitSlop={8}
          >
            <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={18} color={saved ? p.accent : p.text} />
          </PressScale>
          <PressScale onPress={onShare} style={styles.iconBtn} accessibilityLabel="Share tool" hitSlop={8}>
            <Ionicons name="share-outline" size={18} color={p.text} />
          </PressScale>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: GUTTER, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Animated.View style={animStyle}>
          <View style={styles.detailHero}>
            <LinearGradient
              colors={[tool.color + '22', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.detailIcon, { backgroundColor: tool.color + '22' }]}>
              <Ionicons name={tool.icon} size={32} color={tool.color} />
            </View>
            <Text style={styles.detailName}>{tool.name}</Text>
            <Text style={styles.detailTagline}>{tool.tagline}</Text>
          </View>

          <View style={styles.facts}>
            {facts.map((f, i) => (
              <View key={f.label} style={[styles.factCell, i < facts.length - 1 && styles.factDivider]}>
                <Text style={styles.factLabel}>{f.label}</Text>
                <Text style={styles.factValue} numberOfLines={1}>
                  {f.value}
                </Text>
              </View>
            ))}
          </View>

          <Text style={styles.detailDesc}>{tool.description}</Text>

          <Text style={[styles.sectionLabel, { marginTop: 28, marginBottom: 12, paddingHorizontal: 0 }]}>BEST FOR</Text>
          <View style={styles.bestCard}>
            {tool.bestFor.map((item, i) => (
              <View key={i} style={[styles.bestRow, i === tool.bestFor.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.check}>
                  <Ionicons name="checkmark" size={13} color={p.accent} />
                </View>
                <Text style={styles.bestText}>{item}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      <View style={styles.ctaWrap}>
        <PressScale
          onPress={() => {
            successHaptic();
            Linking.openURL(tool.url);
          }}
          accessibilityLabel={`Open ${tool.name} website`}
        >
          <LinearGradient colors={[p.ctaA, p.ctaB]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaBtn}>
            <Text style={styles.ctaText}>Visit website</Text>
            <Ionicons name="arrow-forward" size={17} color={p.onCta} />
          </LinearGradient>
        </PressScale>
        <Text style={styles.ctaUrl}>{tool.url.replace('https://', '').replace('www.', '')}</Text>
      </View>
    </View>
  );
}

/* ================================================================== */
/*  About                                                              */
/* ================================================================== */
function AboutScreen({ onBack }: { onBack: () => void }) {
  const { p, styles, toggle } = useTheme();
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, []);

  const links: { icon: IconName; label: string; value: string; url: string }[] = [
    { icon: 'globe-outline', label: 'Portfolio', value: 'artem-portfolio-ebon.vercel.app', url: 'https://artem-portfolio-ebon.vercel.app' },
    { icon: 'mail-outline', label: 'Email', value: 'Wertyjon2@gmail.com', url: 'mailto:Wertyjon2@gmail.com' },
    { icon: 'briefcase-outline', label: 'Fiverr', value: 'fiverr.com/artem_shap', url: 'https://www.fiverr.com/artem_shap' },
  ];

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.navBar}>
        <PressScale onPress={onBack} style={styles.iconBtn} accessibilityLabel="Go back" hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color={p.text} />
        </PressScale>
        <Text style={styles.navTitle}>About</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: GUTTER, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <View style={styles.aboutHero}>
          <BrandMark size={56} />
          <Text style={styles.aboutTitle}>AI Operator</Text>
          <Text style={styles.aboutSub}>A curated directory of the AI tools solopreneurs actually ship with — searchable, savable, and to the point.</Text>
        </View>

        <Text style={styles.sectionLabel}>CURATED BY</Text>
        <View style={styles.authorCard}>
          <View style={styles.authorAvatar}>
            <Text style={styles.authorInitials}>AS</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.authorName}>Artem Shapovalov</Text>
            <Text style={styles.authorRole}>AI-first web developer · Rotterdam, NL</Text>
          </View>
        </View>

        <View style={styles.linksCard}>
          {links.map((l, i) => (
            <Pressable
              key={l.label}
              onPress={() => {
                lightHaptic();
                Linking.openURL(l.url);
              }}
              style={[styles.linkRow, i === links.length - 1 && { borderBottomWidth: 0 }]}
              accessibilityRole="link"
              accessibilityLabel={`${l.label}: ${l.value}`}
            >
              <View style={styles.linkIcon}>
                <Ionicons name={l.icon} size={17} color={p.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.linkLabel}>{l.label}</Text>
                <Text style={styles.linkValue} numberOfLines={1}>
                  {l.value}
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color={p.faint} />
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>SETTINGS</Text>
        <Pressable onPress={toggle} style={styles.settingRow} accessibilityRole="button" accessibilityLabel="Toggle appearance">
          <View style={styles.linkIcon}>
            <Ionicons name={p.dark ? 'moon-outline' : 'sunny-outline'} size={17} color={p.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkLabel}>Appearance</Text>
            <Text style={styles.linkValue}>{p.dark ? 'Dark' : 'Light'}</Text>
          </View>
          <View style={[styles.switch, p.dark ? styles.switchOn : styles.switchOff]}>
            <View style={[styles.knob, { alignSelf: p.dark ? 'flex-end' : 'flex-start' }]} />
          </View>
        </Pressable>

        <Text style={styles.aboutFoot}>v1.0 · {TOOLS.length} tools · Built with React Native + Expo</Text>
      </ScrollView>
    </View>
  );
}

function Splash() {
  const { styles } = useTheme();
  return (
    <View style={[styles.fill, { alignItems: 'center', justifyContent: 'center' }]}>
      <BrandMark size={56} />
    </View>
  );
}

/* ================================================================== */
/*  Root                                                               */
/* ================================================================== */
type Route = { name: 'home' } | { name: 'detail'; tool: Tool } | { name: 'about' };

export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'home' });
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [dark, setDark] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const reduceMotion = useReduceMotion();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_500Medium,
  });
  // Never block the UI on fonts — render after a short grace period regardless.
  const [graceOver, setGraceOver] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGraceOver(true), 1200);
    return () => clearTimeout(t);
  }, []);
  const ready = fontsLoaded || graceOver;

  // hydrate persisted state
  useEffect(() => {
    (async () => {
      try {
        const [s, t] = await Promise.all([AsyncStorage.getItem('aio:saved'), AsyncStorage.getItem('aio:theme')]);
        if (s) setSaved(new Set(JSON.parse(s)));
        if (t) setDark(t === 'dark');
      } catch {}
      setHydrated(true);
    })();
  }, []);
  useEffect(() => {
    if (hydrated) AsyncStorage.setItem('aio:saved', JSON.stringify([...saved])).catch(() => {});
  }, [saved, hydrated]);
  useEffect(() => {
    if (hydrated) AsyncStorage.setItem('aio:theme', dark ? 'dark' : 'light').catch(() => {});
  }, [dark, hydrated]);

  const p = dark ? DARK : LIGHT;
  const styles = useMemo(() => makeStyles(p), [p]);
  const ctx = useMemo(() => ({ p, styles, toggle: () => setDark((d) => !d) }), [p, styles]);

  const toggleSave = (id: string) =>
    setSaved((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  let content: React.ReactNode;
  if (!ready) content = <Splash />;
  else if (route.name === 'detail')
    content = (
      <DetailScreen
        tool={route.tool}
        onBack={() => setRoute({ name: 'home' })}
        saved={saved.has(route.tool.id)}
        toggleSave={() => toggleSave(route.tool.id)}
        reduceMotion={reduceMotion}
      />
    );
  else if (route.name === 'about') content = <AboutScreen onBack={() => setRoute({ name: 'home' })} />;
  else
    content = (
      <HomeScreen
        onSelect={(t) => setRoute({ name: 'detail', tool: t })}
        onAbout={() => setRoute({ name: 'about' })}
        saved={saved}
        toggleSave={toggleSave}
        reduceMotion={reduceMotion}
      />
    );

  return (
    <ThemeCtx.Provider value={ctx}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      {IS_WEB ? (
        <View style={styles.webBackdrop}>
          <View style={styles.webFrame}>{content}</View>
        </View>
      ) : (
        <View style={styles.fill}>{content}</View>
      )}
    </ThemeCtx.Provider>
  );
}

/* ================================================================== */
/*  Styles (theme-aware)                                               */
/* ================================================================== */
function makeStyles(p: Palette) {
  return StyleSheet.create({
    fill: { flex: 1, backgroundColor: p.bg, paddingTop: TOP_INSET },
    webBackdrop: { flex: 1, minHeight: WIN_H, backgroundColor: p.backdrop, alignItems: 'center', justifyContent: 'center' },
    webFrame: {
      width: SCREEN_W,
      height: Math.min(WIN_H, 880),
      backgroundColor: p.bg,
      paddingTop: TOP_INSET,
      borderRadius: 34,
      borderWidth: 1,
      borderColor: p.border,
      overflow: 'hidden',
    },

    compactBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: GUTTER,
      paddingBottom: 12,
      paddingTop: 4,
      backgroundColor: p.dark ? 'rgba(8,8,10,0.92)' : 'rgba(251,251,253,0.92)',
      borderBottomWidth: 1,
      borderBottomColor: p.border,
    },
    compactTitle: { color: p.text, fontFamily: F.semi, fontSize: 16 },

    header: { paddingHorizontal: GUTTER, paddingTop: 8, paddingBottom: 18 },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
    kicker: { color: p.dim, fontFamily: F.mono, fontSize: 11, letterSpacing: 1.5 },
    headerBtns: { flexDirection: 'row', gap: 8 },
    headerIcon: {
      width: 38,
      height: 38,
      borderRadius: 11,
      backgroundColor: p.surface,
      borderWidth: 1,
      borderColor: p.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: { color: p.text, fontFamily: F.bold, fontSize: 32, letterSpacing: -0.8 },
    subtitle: { color: p.dim, fontFamily: F.reg, fontSize: 15, lineHeight: 22, marginTop: 8, maxWidth: 320 },

    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginHorizontal: GUTTER,
      paddingHorizontal: 14,
      height: 48,
      borderRadius: 13,
      backgroundColor: p.surface,
      borderWidth: 1,
      borderColor: p.border,
    },
    searchInput: { flex: 1, color: p.text, fontFamily: F.med, fontSize: 15, padding: 0, ...(IS_WEB ? { outlineStyle: 'none' as any } : null) },

    chipsRow: { paddingHorizontal: GUTTER, gap: 8, paddingTop: 16 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 15,
      height: 36,
      borderRadius: 10,
      backgroundColor: p.surface,
      borderWidth: 1,
      borderColor: p.border,
    },
    chipActive: { backgroundColor: p.text, borderColor: p.text },
    chipText: { color: p.dim, fontFamily: F.med, fontSize: 13.5 },
    chipTextActive: { color: p.bg, fontFamily: F.semi },

    sectionLabel: { color: p.faint, fontFamily: F.mono, fontSize: 11, letterSpacing: 1.5, paddingHorizontal: GUTTER },
    listHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 30,
      marginBottom: 6,
      paddingRight: GUTTER,
    },
    countMono: { color: p.faint, fontFamily: F.mono, fontSize: 11.5 },

    featCard: {
      height: 168,
      borderRadius: 18,
      padding: 18,
      backgroundColor: p.bgElevated,
      borderWidth: 1,
      borderColor: p.border,
      overflow: 'hidden',
      justifyContent: 'space-between',
    },
    featTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    featTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: p.dark ? 'rgba(124,92,255,0.14)' : 'rgba(106,72,255,0.10)',
      borderWidth: 1,
      borderColor: p.dark ? 'rgba(124,92,255,0.28)' : 'rgba(106,72,255,0.24)',
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 99,
    },
    featTagText: { color: p.accent, fontFamily: F.mono, fontSize: 9.5, letterSpacing: 1 },
    featName: { color: p.text, fontFamily: F.bold, fontSize: 22, letterSpacing: -0.4, marginTop: 12 },
    featTagline: { color: p.dim, fontFamily: F.reg, fontSize: 13.5, lineHeight: 19, marginTop: 4 },
    featFoot: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 10 },
    metaMono: { color: p.faint, fontFamily: F.mono, fontSize: 10.5, letterSpacing: 0.5 },
    metaDot: { color: p.faint, fontSize: 11 },

    list: { paddingHorizontal: GUTTER, marginTop: 4 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: p.border,
    },
    iconTile: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    rowName: { color: p.text, fontFamily: F.semi, fontSize: 16, letterSpacing: -0.2 },
    rowTagline: { color: p.dim, fontFamily: F.reg, fontSize: 13, marginTop: 2 },
    saveBtn: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },

    empty: { alignItems: 'center', paddingHorizontal: GUTTER, paddingVertical: 48 },
    emptyIcon: {
      width: 52,
      height: 52,
      borderRadius: 15,
      backgroundColor: p.surface,
      borderWidth: 1,
      borderColor: p.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptyTitle: { color: p.text, fontFamily: F.semi, fontSize: 17 },
    emptyText: { color: p.dim, fontFamily: F.reg, fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 6, maxWidth: 260 },
    emptyBtn: {
      marginTop: 18,
      paddingHorizontal: 22,
      height: 42,
      borderRadius: 11,
      backgroundColor: p.surfaceHi,
      borderWidth: 1,
      borderColor: p.borderHi,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyBtnText: { color: p.text, fontFamily: F.semi, fontSize: 14 },

    navBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: GUTTER,
      paddingBottom: 6,
    },
    navTitle: { color: p.dim, fontFamily: F.semi, fontSize: 14 },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: p.surface,
      borderWidth: 1,
      borderColor: p.border,
      alignItems: 'center',
      justifyContent: 'center',
    },

    detailHero: { backgroundColor: p.bgElevated, borderWidth: 1, borderColor: p.border, borderRadius: 22, padding: 22, overflow: 'hidden' },
    detailIcon: { width: 62, height: 62, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    detailName: { color: p.text, fontFamily: F.bold, fontSize: 28, letterSpacing: -0.6 },
    detailTagline: { color: p.dim, fontFamily: F.reg, fontSize: 15, lineHeight: 21, marginTop: 6 },

    facts: { flexDirection: 'row', marginTop: 14, backgroundColor: p.surface, borderWidth: 1, borderColor: p.border, borderRadius: 16, paddingVertical: 14 },
    factCell: { flex: 1, paddingHorizontal: 14 },
    factDivider: { borderRightWidth: 1, borderRightColor: p.border },
    factLabel: { color: p.faint, fontFamily: F.mono, fontSize: 9.5, letterSpacing: 1 },
    factValue: { color: p.text, fontFamily: F.semi, fontSize: 14, marginTop: 6 },

    detailDesc: { color: p.dim, fontFamily: F.reg, fontSize: 15.5, lineHeight: 25, marginTop: 22 },

    bestCard: { backgroundColor: p.surface, borderWidth: 1, borderColor: p.border, borderRadius: 16, paddingHorizontal: 16 },
    bestRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: p.border },
    check: { width: 24, height: 24, borderRadius: 7, backgroundColor: p.dark ? 'rgba(124,92,255,0.14)' : 'rgba(106,72,255,0.10)', alignItems: 'center', justifyContent: 'center' },
    bestText: { color: p.text, fontFamily: F.med, fontSize: 14.5, flex: 1, lineHeight: 20 },

    ctaWrap: {
      paddingHorizontal: GUTTER,
      paddingTop: 12,
      paddingBottom: Platform.OS === 'ios' ? 30 : 18,
      borderTopWidth: 1,
      borderTopColor: p.border,
      backgroundColor: p.bg,
    },
    ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 54, borderRadius: 15 },
    ctaText: { color: p.onCta, fontFamily: F.bold, fontSize: 16 },
    ctaUrl: { color: p.faint, fontFamily: F.mono, fontSize: 11.5, textAlign: 'center', marginTop: 10 },

    /* About */
    aboutHero: { alignItems: 'center', paddingVertical: 22, marginBottom: 10 },
    aboutTitle: { color: p.text, fontFamily: F.bold, fontSize: 26, letterSpacing: -0.5, marginTop: 18 },
    aboutSub: { color: p.dim, fontFamily: F.reg, fontSize: 14.5, lineHeight: 22, textAlign: 'center', marginTop: 10, maxWidth: 320 },
    authorCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginTop: 12,
      marginHorizontal: GUTTER,
      padding: 16,
      borderRadius: 16,
      backgroundColor: p.surface,
      borderWidth: 1,
      borderColor: p.border,
    },
    authorAvatar: {
      width: 50,
      height: 50,
      borderRadius: 14,
      backgroundColor: p.dark ? 'rgba(124,92,255,0.16)' : 'rgba(106,72,255,0.12)',
      borderWidth: 1,
      borderColor: p.dark ? 'rgba(124,92,255,0.3)' : 'rgba(106,72,255,0.26)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    authorInitials: { color: p.accent, fontFamily: F.bold, fontSize: 17, letterSpacing: 0.5 },
    authorName: { color: p.text, fontFamily: F.semi, fontSize: 17 },
    authorRole: { color: p.dim, fontFamily: F.reg, fontSize: 13, marginTop: 3 },

    linksCard: {
      marginTop: 20,
      marginHorizontal: GUTTER,
      borderRadius: 16,
      backgroundColor: p.surface,
      borderWidth: 1,
      borderColor: p.border,
      paddingHorizontal: 16,
    },
    linkRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: p.border },
    linkIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: p.dark ? 'rgba(124,92,255,0.12)' : 'rgba(106,72,255,0.09)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    linkLabel: { color: p.text, fontFamily: F.semi, fontSize: 14.5 },
    linkValue: { color: p.dim, fontFamily: F.mono, fontSize: 11.5, marginTop: 3 },

    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      marginTop: 12,
      marginHorizontal: GUTTER,
      padding: 14,
      borderRadius: 16,
      backgroundColor: p.surface,
      borderWidth: 1,
      borderColor: p.border,
    },
    switch: { width: 46, height: 28, borderRadius: 99, padding: 3, justifyContent: 'center' },
    switchOn: { backgroundColor: p.accentSolid },
    switchOff: { backgroundColor: p.borderHi },
    knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },

    aboutFoot: { color: p.faint, fontFamily: F.mono, fontSize: 11, textAlign: 'center', marginTop: 28, letterSpacing: 0.4 },
  });
}
