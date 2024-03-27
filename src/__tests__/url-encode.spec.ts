import { describe, it, expect } from 'vitest'
import { LocationQuery } from 'vue-router'
import { arraysEqual } from 'xen-dev-utils'
import { mapWhiteAsdfBlackQwerty, mapWhiteQweZxcBlack123Asd } from '../keyboard-mapping'

import {
  decodeKeyColors,
  decodeLines,
  decodeQuery,
  encodeQuery,
  encodeKeyColors,
  encodeLines,
  parseFloat36,
  encodeNumber,
  decodeNumber,
  encodeKeyMap,
  decodeKeyMap,
  DecodedState
} from '../url-encode'
import { DEFAULT_NUMBER_OF_COMPONENTS } from '../constants'
import { parseScaleWorkshop2Line } from 'sonic-weave'

describe('URL encoder', () => {
  it('can encode all line types', () => {
    const lines = [
      '81/80',
      '-42.00',
      '2\\5',
      '700.01',
      '1,0723',
      '2/1',
      '2\\3<5>',
      '[3/2 -2,1>',
      '3/2+1.23',
      '4/3 - 0.1'
    ]
    expect(encodeLines(lines)).toBe(
      '29F28_-16._2B5_jg.01_1C0k3_2F1_2B3L5R_Q3F2S-2C1R_3F2P1.n_4F3S-S0.1'
    )
  })

  it('can decode all line types', () => {
    const lines = decodeLines('29F28_-16._2B5_jg.01_1C0k3_2F1_2B3L5R_Q3F2S-2C1R_3F2P1.n_4F3S-S0.1')
    const expected = [
      '81/80',
      '-42.',
      '2\\5',
      '700.01',
      '1,0723',
      '2/1',
      '2\\3<5>',
      '[3/2 -2,1>',
      '3/2+1.23',
      '4/3 - 0.1'
    ]
    expect(arraysEqual(lines, expected)).toBeTruthy()
  })

  it('can encode zero-of-edo', () => {
    const lines = ['0\\1', '0\\12']
    expect(encodeLines(lines)).toBe('B1_Bc')
  })

  it('can decode nothing-of-edo', () => {
    const lines = decodeLines('B1_Bc')
    const expected = ['\\1', '\\12']
    expect(lines).toEqual(expected)
  })

  it('can encode key colors', () => {
    const keyColors = ['blue', 'black', 'white', 'black', 'red', 'red']
    expect(encodeKeyColors(keyColors)).toBe('blue-~-red_red')
  })

  it('can decode key colors', () => {
    const keyColors = decodeKeyColors('blue-~-red_red')
    const expected = ['blue', 'black', 'white', 'black', 'red', 'red']
    expect(arraysEqual(keyColors, expected)).toBeTruthy()
  })

  it('can decode a whole URL', () => {
    const url = new URL(
      'https://scaleworkshop.lumipakkanen.com/?n=Equal%20pentatonic&l=1B5_2B5_3B5_4B5_5B5&c=~teal_cyan-blue&f=c0&version=2.0.0'
    )
    const decoded = decodeQuery(url.searchParams)
    expect(decoded.scaleName).toBe('Equal pentatonic')
    expect(decoded.scaleLines.join(' ')).toBe('1\\5 2\\5 3\\5 4\\5 5\\5')
    expect(decoded.keyColors.join(' ')).toBe('white teal cyan black blue')
    expect(decoded.baseFrequency).toBe(432)
    expect(decoded.baseMidiNote).toBe(69)
    expect(decoded.isomorphicHorizontal).toBe(1)
    expect(decoded.isomorphicVertical).toBe(5)
  })

  it('can encode the app state', () => {
    const state: DecodedState = {
      scaleName: '', // default
      scaleLines: ['5/4', '6/4', '7/4', '8/4'],
      keyColors: ['white', 'white', 'black', 'white'],
      baseFrequency: 440, // default
      baseMidiNote: 60,
      isomorphicHorizontal: 1, // default
      isomorphicVertical: 3,
      // All defaults from here
      keyboardMode: 'isomorphic',
      pianoMode: 'Asdf',
      equaveShift: 0,
      degreeShift: 0,
      waveform: 'semisine',
      attackTime: 0.01,
      decayTime: 0.3,
      sustainLevel: 0.8,
      releaseTime: 0.01,
      pingPongDelayTime: 0.3,
      pingPongFeedback: 0.8,
      pingPongSeparation: 1.0,
      pingPongGain: 0.0
    }
    const encoded = encodeQuery(state)
    expect(encoded).toMatchObject({
      l: '5F4_6F4_7F4_8F4',
      c: '~~-~',
      m: '1o',
      v: '3'
    })
  })

  it('can escape invalid lines', () => {
    const lines = ['3/2', 'foo', 'BAR', '2/1']
    expect(encodeLines(lines)).toBe('3F2_EfEoEo_EBAER_2F1')
  })

  it('can decode invalid lines', () => {
    const expected = ['3/2', 'foo', 'BAR', '2/1']
    expect(arraysEqual(decodeLines('3F2_EfEoEo_EBAER_2F1'), expected)).toBeTruthy()
  })
})

describe('URL decoder', () => {
  it('can decode the app state', () => {
    const state: LocationQuery = {
      l: '5F4_6F4_7F4_8F4',
      p: '1'
    }
    const decoded = decodeQuery(state)
    expect(decoded).toMatchObject({
      scaleLines: ['5/4', '6/4', '7/4', '8/4'],
      pianoMode: 'QweZxc1'
    })
  })
})

describe('Float 36 parser', () => {
  it('can decode integers', () => {
    expect(parseFloat36('10')).toBe(36)
  })

  it('can decode a known value', () => {
    expect(parseFloat36('3.53i0tuycp')).toBeCloseTo(3.14159)
  })

  it('can handle leading zeroes after the triginta seximal point', () => {
    expect(parseFloat36('1.01')).toBeCloseTo(1 + 1 / 1296, 4)
  })

  it('can handle trailing zeroes after the triginta seximal point', () => {
    expect(parseFloat36('10.10')).toBeCloseTo(36 + 1 / 36, 4)
  })

  it('can decode random values', () => {
    const value = Math.random() * 1000
    expect(parseFloat36(value.toString(36))).toBeCloseTo(value)
  })
})

describe('Integer encoder', () => {
  it('can encode non-negative numbers less than 64 using a single character', () => {
    for (let i = 0; i < 64; ++i) {
      expect(encodeNumber(i)).toHaveLength(1)
    }
  })

  it('can encode and decode all numbers in the range from -1000 to 1000', () => {
    for (let i = -1000; i <= 1000; ++i) {
      expect(decodeNumber(encodeNumber(i))).toBe(i)
    }
  })
})

describe('Keyboard map encoder', () => {
  it('can encode the old ASDF map', () => {
    const keyboardMapping = mapWhiteAsdfBlackQwerty(decodeKeyColors('~-~~-~-~~-~-'), 0, 0)
    expect(encodeKeyMap(keyboardMapping)).toBe('............-1-1.46.9bd.gi023578acefhj...........')
  })

  it('can encode the old ZXCV map', () => {
    const keyboardMapping = mapWhiteQweZxcBlack123Asd(decodeKeyColors('~-~~-~-~~-~-'), 12, 0, 0)
    expect(encodeKeyMap(keyboardMapping)).toBe('bd.gi.lnp.sucefhjkmoqrtv-1-1.46.9bd.gh.023578acef')
  })

  it('can encode large custom values', () => {
    const keyboardMapping = new Map()
    keyboardMapping.set('KeyA', 1000)
    keyboardMapping.set('Digit2', -500)
    expect(encodeKeyMap(keyboardMapping)).toBe(
      '.-7Q-......................--fE-......................'
    )
  })

  it('can decode the old ASDF map', () => {
    const decoded = decodeKeyMap('............-1-1.46.9bd.gi023578acefhj...........')
    const keyboardMapping = mapWhiteAsdfBlackQwerty(decodeKeyColors('~-~~-~-~~-~-'), 0, 0)
    for (const [key, value] of keyboardMapping) {
      expect(decoded.get(key)).toBe(value)
    }
    for (const [key, value] of decoded) {
      expect(keyboardMapping.get(key)).toBe(value)
    }
  })

  it('can decode the old ZXCV map', () => {
    const decoded = decodeKeyMap('bd.gi.lnp.sucefhjkmoqrtv-1-1.46.9bd.gh.023578acef')
    const keyboardMapping = mapWhiteQweZxcBlack123Asd(decodeKeyColors('~-~~-~-~~-~-'), 12, 0, 0)
    for (const [key, value] of keyboardMapping) {
      expect(decoded.get(key)).toBe(value)
    }
    for (const [key, value] of decoded) {
      expect(keyboardMapping.get(key)).toBe(value)
    }
  })

  it('can decode large custom values', () => {
    const map = decodeKeyMap('.-7Q-......................--fE-......................')
    expect(map.size).toBe(2)
    expect(map.get('KeyA')).toBe(1000)
    expect(map.get('Digit2')).toBe(-500)
  })
})

const COMMUNITY_SCALES = [
  ['', 7690.06044720528, '?l=dFc_9F8_7F6_5F4_4F3_bF8_3F2_dF8_5F3_7F4_bF6_2F1&version=2.1.0'],
  [
    '12_duodene_marvel',
    7803.732,
    '?n=12_duodene_marvel&l=37.ek_5l.6s_8s.lc_an.nq_dv.ai_g9.02q_jg.ha_mo.42_oj.6g_s9.13_u4.d8_xc.&version=2.1.0'
  ],
  [
    '12_starling_WE',
    8001.564,
    '?n=12_starling_WE&l=3f.d9_6g.e9_8n.5i_c2.ir_du.pj_ha.b0_jh.029_mi.39_px.gi_s4.7r_v5.8r_xc.&version=2.1.0'
  ],
  [
    '',
    18000,
    '?l=29F28_74F6r_gFf_aF9_9F8_74F69_wFr_6F5_5F4_29F1s_wFp_4F3_rFk_19Fw_1sF19_14Fr_3F2_pFg_3kF29_8F5_5F3_rFg_69F3k_gF9_9F5_fF8_6rF3k_4gF29_2F1&f=7c&m=1o&v=7&w=w&y=334&s=0&r=ra&version=2.1.0'
  ],
  [
    '',
    18000,
    '?l=29F28_74F6r_gFf_aF9_9F8_74F69_wFr_6F5_5F4_29F1s_wFp_4F3_rFk_19Fw_1sF19_14Fr_3F2_pFg_3kF29_8F5_5F3_rFg_69F3k_gF9_9F5_fF8_6rF3k_4gF29_2F1&f=7c&m=1o&v=7&w=w&y=334&s=0&r=ra&version=2.1.0'
  ],
  [
    '',
    9210.242699677236,
    '?l=2oF2j_9F8_8F7_gFd_9F7_iFd_3kF2j_3F2_40F2j_rFg_cF7_oFd_rFe_2F1&f=64&w=q&y=46&version=2.1.0'
  ],
  [
    '',
    49200.000000000015,
    '?l=40F3z_1sF1r_14F13_xFw_pFo_lFk_3rF3k_gFf_fFe_eFd_dFc_cFb_bFa_aF9_9F8_3zF3i_8F7_fFd_7F6_dFb_39F2q_6F5_2jF23_bF9_gFd_qFl_5F4_1rF1e_eFb_9F7_dFa_lFg_1tF1d_4F3_rFk_fFb_bF8_iFd_7F5_19Fw_1sF19_aF7_dF9_gFb_mFf_14Fr_3F2_2qF1t_wFl_kFd_eF9_bF7_2sF1r_8F5_lFd_dF8_iFb_46F2j_5F3_5gF39_mFd_cF7_qFf_7F4_70F3z_gF9_9F5_kFb_bF6_oFd_dF7_sFf_fF8_74F3r_14Fl_1cFp_1sFx_13Fk_1rFw_3zF20_2F1&c=~~-~-~-~-&f=7c&m=0&v=7&w=w&y=334&s=0&r=ra&version=2.1.0'
  ],
  ['', 4926.272689614714, '?l=8F7_6F5_1bFz_1hFz_cF7_9F5_2F1&f=64&version=2.1.0'],
  [
    '',
    7769.54408208727,
    '?l=rFq_a1F9e_7irF6s4_fFd_b9F9e_46fF3e2_34t9F2g5g_jFd_e9F9e_5ajF3e2_3yw9F2g5g_7xF4p_5xrF3e2_2F1&f=64&y=46&version=2.1.0'
  ],
  [
    '',
    12027.782227710173,
    '?l=vFu_gFf_hFf_7F6_6F5_jFf_dFa_4F3_7F5_17Fu_mFf_nFf_8F5_5F3_qFf_9F5_sFf_tFf_2F1&f=7c&m=1o&v=7&w=w&y=334&s=0&r=ra&version=2.1.0'
  ],
  [
    '"Fibered scale" with polyoffset 8:10:11 and "fiber" Pyth[5]',
    9765.515557763865,
    '?n=%22Fibered%20scale%22%20with%20polyoffset%208%3A10%3A11%20and%20%22fiber%22%20Pyth%5B5%5D&l=xFwSPS1.oz_aF9S-S3.02l_wFrS-S4.1c_bF9S-S2.1m_5F4S-S0.2z_4F3S-S1.dp_bF8SPS0.ba_14FrS-S4.gb_3F2SPS1.dp_18FrS-S4.022_rFgSPS4.1c_gF9S-S2.rf_bF6S-S1.02f_fF8SPS1.aq_2F1&f=4z&h=2&v=-1&y=46&version=2.1.0'
  ],
  [
    '1/3-Comma Meantone',
    7831.282999999999,
    '?n=1%2F3-Comma%20Meantone&l=3i.01x_59.fw_8r.ht_aj.41_e1.5y_hj.7v_ja.lu_ms.nr_ok.9z_s2.bw_tt.pv_xc.&k=p&y=46&version=2.1.0'
  ],
  [
    '11 equal divisions of 2/1',
    9127.207500320406,
    '?n=11%20equal%20divisions%20of%202%2F1&l=lFk_4rF4g_9F8_59F4g_16rFzk_29F1s_7F5_1lF14_3F2_1rF14_e9F8w_rFg_frF8w_jFa_2F1&f=64&h=2&v=-1&y=46&version=2.1.0'
  ],
  [
    '1911edo 311 et 1600 85u0d',
    53934.06593406593,
    '?n=1911edo%20311%20et%201600%2085u0d&l=11B1h3_22B1h3_28B1h3_39B1h3_3fB1h3_4gB1h3_4mB1h3_5nB1h3_5tB1h3_6uB1h3_70B1h3_81B1h3_87B1h3_98B1h3_9eB1h3_afB1h3_alB1h3_bmB1h3_bsB1h3_ctB1h3_czB1h3_e0B1h3_f1B1h3_f7B1h3_g8B1h3_geB1h3_hfB1h3_hlB1h3_imB1h3_isB1h3_jtB1h3_jzB1h3_l0B1h3_l6B1h3_m7B1h3_mdB1h3_neB1h3_nkB1h3_olB1h3_orB1h3_psB1h3_pyB1h3_qzB1h3_s0B1h3_s6B1h3_t7B1h3_tdB1h3_ueB1h3_ukB1h3_vlB1h3_vrB1h3_wsB1h3_wyB1h3_xzB1h3_y5B1h3_z6B1h3_zcB1h3_10dB1h3_10jB1h3_11kB1h3_11qB1h3_12rB1h3_12xB1h3_13yB1h3_144B1h3_14zB1h3_155B1h3_166B1h3_16cB1h3_17dB1h3_17jB1h3_18kB1h3_18qB1h3_19rB1h3_19xB1h3_1ayB1h3_1b4B1h3_1c5B1h3_1cbB1h3_1dcB1h3_1diB1h3_1ejB1h3_1epB1h3_1fqB1h3_1fwB1h3_1gxB1h3_1h3B1h3&version=2.1.0'
  ],
  [
    '20 equal divisions of 2/1',
    4440,
    '?n=20%20equal%20divisions%20of%202%2F1&l=6o._dc._ic._nc._sc._xc.&f=79.miqdhkcvh&m=1o&version=2.1.0'
  ],
  [
    '22 equal divisions of 2/1',
    4745.454545454546,
    '?n=22%20equal%20divisions%20of%202%2F1&l=4Bm_6Bm_9Bm_dBm_fBm_iBm_mBm&f=3t&y=4q&version=2.1.0'
  ],
  [
    '321 equal divisions of 2/1',
    10800,
    '?n=321%20equal%20divisions%20of%202%2F1&l=pB8x_11B8x_1qB8x_22B8x_2rB8x_33B8x_3sB8x_44B8x_4tB8x_55B8x_5uB8x_66B8x_6vB8x_77B8x_7wB8x_88B8x_8xB8x&f=7m&y=4q&version=2.1.0'
  ],
  [
    '4-fibered scale with fiber Pyth[5] and polyoffset 14:17:19:23',
    11499.525302084247,
    '?n=4-fibered%20scale%20with%20fiber%20Pyth%5B5%5D%20and%20polyoffset%2014%3A17%3A19%3A23&l=1lF1k_crFcg_1frF1ds_9F8_e9Fcg_hFe_1xF1k_29F1s_jFe_49F34_h9Fcg_3F2_4rF34_129Fow_nFe_rFg_16rFow_1fFs_5rF34_2F1&f=64&h=2&v=-1&y=46&version=2.1.0'
  ],
  [
    'AGS(10/9, 11/10, 12/11)',
    10390.408237878595,
    '?n=AGS%2810%2F9%2C%2011%2F10%2C%2012%2F11%29&l=2gF29_aF9_wFr_bF9_8wF6r_4F3_9sF6r_14Fr_3kF29_18Fr_zkFk9_gF9_134Fk9_4gF29_2F1&f=64&h=2&v=-1&y=46&version=2.1.0'
  ],
  [
    'AGS(10/9, 11/10, 12/11)',
    10390.408237878595,
    '?n=AGS(10%2F9%2C%2011%2F10%2C%2012%2F11)&l=2gF29_aF9_wFr_bF9_8wF6r_4F3_9sF6r_14Fr_3kF29_18Fr_zkFk9_gF9_134Fk9_4gF29_2F1&f=64&h=2&v=-1&y=46&version=2.1.0'
  ],
  [
    'C',
    8175.445534874084,
    '?n=C&l=aF9-29F28_aF9_9F8_5F4-29F28_5F4_5F4PaF9-29F28_5F4PaF9_3F2_5F3-29F28_5F3_5F3PaF9-29F28_5F3PaF9_2F1&c=~&f=3k&m=a&v=a&w=1&a=5&y=334&s=rs&r=rs&version=2.1.0'
  ],
  [
    'Dappled',
    685.282660304675,
    '?n=Dappled&l=4Fd_aFp_2fF1a_wFl_1hF19_2hF1s_2jF2f_2vF2m_3tF2t_5cF4d_5xF5f_8qF73&y=4q&version=2.1.0'
  ],
  [
    'detempered miracle[31]',
    19200.000000000004,
    '?n=detempered%20miracle%5B31%5D&l=1sF1r_lFk_gFf_cFb_9F8_8F7_7F6_6F5_bF9_5F4_9F7_lFg_4F3_bF8_7F5_aF7_gFb_3F2_wFl_eF9_8F5_iFb_5F3_cF7_7F4_gF9_bF6_fF8_14Fl_1rFw_2F1&f=7c&m=1o&v=7&w=w&y=334&s=0&r=ra&version=2.1.0'
  ],
  [
    'Harmonic Series Trio',
    14119.080225652275,
    '?n=Harmonic%20Series%20Trio&l=1F5_1F5SPSfFe_1F5SPS6F5_2F5_2F5SPSfFe_2F5SPS6F5_3F5_3F5SPSfFe_3F5SPS6F5_4F5_4F5SPSfFe_4F5SPS6F5_5F5_5F5SPSfFe_5F5SPS6F5_6F5_6F5SPSfFe_6F5SPS6F5_7F5_7F5SPSfFe_7F5SPS6F5_8F5_8F5SPSfFe_8F5SPS6F5_9F5_9F5SPSfFe_9F5SPS6F5_aF5_aF5SPSfFe_aF5SPS6F5_bF5_bF5SPSfFe_bF5SPS6F5_cF5_cF5SPSfFe_cF5SPS6F5_dF5_dF5SPSfFe_dF5SPS6F5&f=74&y=4q&version=2.1.0'
  ],
  [
    'Rank 2 temperament (108.062, 1\\7)',
    13069.302,
    '?n=Rank%202%20temperament%20%28108.062%2C%201%5C7%29&l=18.jb_30.01q_4r.bx_60.3g_7r.dn_9i.nt_ar.fd_ci.pj_ea.7y_fi.r9_ha.9o_j1.ju_ka.15_m1.lk_nt.3z_p1.na_qt.5p_sk.fv_tt.7f_vk.hl_xc.&f=7c&m=1o&v=7&w=w&y=334&s=0&r=ra&version=2.1.0'
  ],
  [
    'Rank 2 temperament (16.314, 1\\28)',
    68113.58399999997,
    '?n=Rank%202%20temperament%20%2816.314%2C%201%5C28%29&l=g.8q_q.f3_w.hg_16.nt_1n.4r_1x.4_23.dh_2d.ju_2u.0s_34.75_3a.9i_3k.fv_40.ol_4b.37_4h.5j_4r.bx_57.kn_5h.r0_5o.01l_5y.7y_6e.6_6o.n1_6u.pe_75.3z_7l.cp_7v.j2_81.lf_8c._8s.8q_92.f3_98.hg_9i.nt_9z.4r_a9.4_af.dh_ap.ju_b6.0s_bg.75_bm.9i_bw.fv_cc.ol_cn.37_ct.5j_d3.bx_dj.kn_dt.r0_e0.01l_ea.7y_eq.6_f0.n1_f6.pe_fh.3z_fx.cp_g7.j2_gd.lf_go._h4.8q_he.f3_hk.hg_hu.nt_ib.4r_il.4_ir.dh_j1.ju_ji.0s_js.75_jy.9i_k8.fv_ko.ol_kz.37_l5.5j_lf.bx_lv.kn_m5.r0_mc.01l_mm.7y_n2.6_nc.n1_ni.pe_nt.3z_o9.cp_oj.j2_op.lf_p0._pg.8q_pq.f3_pw.hg_q6.nt_qn.4r_qx.4_r3.dh_rd.ju_ru.0s_s4.75_sa.9i_sk.fv_t0.ol_tb.37_th.5j_tr.bx_u7.kn_uh.r0_uo.01l_uy.7y_ve.6_vo.n1_vu.pe_w5.3z_wl.cp_wv.j2_x1.lf_xc.&f=7c&m=0&v=7&w=w&y=334&s=0&r=ra&version=2.1.0'
  ],
  [
    'Rank 2 temperament (348.604, 600.)',
    23400,
    '?n=Rank%202%20temperament%20%28348.604%2C%20600.%29&l=14.6c_1k.2q_2p.5s_3t.c4_4a.58_5e.bk_5v.4o_6z.b0_83.hc_8k.ag_9o.gs_as.n4_b9.g8_cd.mk_cu.fo_dy.m0_f3.02_fj.lg_go._hs.6c_i8.2q_jd.5s_kh.c4_ky.58_m2.bk_mj.4o_nn.b0_or.hc_p8.ag_qc.gs_rg.n4_rx.g8_t1.mk_ti.fo_um.m0_vr.02_w7.lg_xc.&f=7c&m=1o&v=7&w=w&y=334&s=0&r=ra&version=2.1.0'
  ],
  [
    'Rank 2 temperament (348.942, 600.)',
    14860.344000000001,
    '?n=Rank%202%20temperament%20%28348.942%2C%20600.%29&l=16.gi_2p.ok_3w.da_5f.lc_6m.a2_85.i4_9o.q6_av.ew_ce.my_dl.16_f4.1z_go._hu.gi_jd.ok_kk.da_m3.lc_na.a2_ot.i4_qc.q6_rj.ew_t2.my_u9.16_vs.1z_xc.&f=7c&m=1o&v=7&w=w&y=334&s=0&r=ra&version=2.1.0'
  ],
  [
    'Rank 2 temperament (108.062, 1\\7)',
    13069.302,
    '?n=Rank%202%20temperament%20(108.062%2C%201%5C7)&l=18.jb_30.01q_4r.bx_60.3g_7r.dn_9i.nt_ar.fd_ci.pj_ea.7y_fi.r9_ha.9o_j1.ju_ka.15_m1.lk_nt.3z_p1.na_qt.5p_sk.fv_tt.7f_vk.hl_xc.&f=7c&m=1o&v=7&w=w&y=334&s=0&r=ra&version=2.1.0'
  ],
  [
    'Rank 2 temperament (16.314, 1\\28)',
    68113.58399999997,
    '?n=Rank%202%20temperament%20(16.314%2C%201%5C28)&l=g.8q_q.f3_w.hg_16.nt_1n.4r_1x.4_23.dh_2d.ju_2u.0s_34.75_3a.9i_3k.fv_40.ol_4b.37_4h.5j_4r.bx_57.kn_5h.r0_5o.01l_5y.7y_6e.6_6o.n1_6u.pe_75.3z_7l.cp_7v.j2_81.lf_8c._8s.8q_92.f3_98.hg_9i.nt_9z.4r_a9.4_af.dh_ap.ju_b6.0s_bg.75_bm.9i_bw.fv_cc.ol_cn.37_ct.5j_d3.bx_dj.kn_dt.r0_e0.01l_ea.7y_eq.6_f0.n1_f6.pe_fh.3z_fx.cp_g7.j2_gd.lf_go._h4.8q_he.f3_hk.hg_hu.nt_ib.4r_il.4_ir.dh_j1.ju_ji.0s_js.75_jy.9i_k8.fv_ko.ol_kz.37_l5.5j_lf.bx_lv.kn_m5.r0_mc.01l_mm.7y_n2.6_nc.n1_ni.pe_nt.3z_o9.cp_oj.j2_op.lf_p0._pg.8q_pq.f3_pw.hg_q6.nt_qn.4r_qx.4_r3.dh_rd.ju_ru.0s_s4.75_sa.9i_sk.fv_t0.ol_tb.37_th.5j_tr.bx_u7.kn_uh.r0_uo.01l_uy.7y_ve.6_vo.n1_vu.pe_w5.3z_wl.cp_wv.j2_x1.lf_xc.&f=7c&m=0&v=7&w=w&y=334&s=0&r=ra&version=2.1.0'
  ],
  [
    'Rank 2 temperament (348.604, 600.)',
    23400,
    '?n=Rank%202%20temperament%20(348.604%2C%20600.)&l=14.6c_1k.2q_2p.5s_3t.c4_4a.58_5e.bk_5v.4o_6z.b0_83.hc_8k.ag_9o.gs_as.n4_b9.g8_cd.mk_cu.fo_dy.m0_f3.02_fj.lg_go._hs.6c_i8.2q_jd.5s_kh.c4_ky.58_m2.bk_mj.4o_nn.b0_or.hc_p8.ag_qc.gs_rg.n4_rx.g8_t1.mk_ti.fo_um.m0_vr.02_w7.lg_xc.&f=7c&m=1o&v=7&w=w&y=334&s=0&r=ra&version=2.1.0'
  ],
  [
    'Rank 2 temperament (348.942, 600.)',
    14860.344000000001,
    '?n=Rank%202%20temperament%20(348.942%2C%20600.)&l=16.gi_2p.ok_3w.da_5f.lc_6m.a2_85.i4_9o.q6_av.ew_ce.my_dl.16_f4.1z_go._hu.gi_jd.ok_kk.da_m3.lc_na.a2_ot.i4_qc.q6_rj.ew_t2.my_u9.16_vs.1z_xc.&f=7c&m=1o&v=7&w=w&y=334&s=0&r=ra&version=2.1.0'
  ],
  [
    'sorting',
    6959.896805479104,
    '?n=sorting&l=dFc_bF9_4F3_bF8_dF9_3F2_dF8_gF9_bF6_2F1&f=6l.i&version=2.1.0'
  ]
]

describe('Decoding of scales found in the wild', () => {
  it.each(COMMUNITY_SCALES)('Decodes %s', (name, checksum, encoded) => {
    const url = new URL('https://scaleworkshop.plainsound.org/' + encoded)
    const decoded = decodeQuery(url.searchParams)
    const intervals = decoded.scaleLines.map((line) =>
      parseScaleWorkshop2Line(line, DEFAULT_NUMBER_OF_COMPONENTS)
    )
    const centsSum = intervals.reduce((total, interval) => total + interval.value.totalCents(), 0)
    expect(decoded.scaleName).toBe(name)
    expect(checksum).toBeCloseTo(centsSum)
  })
})
