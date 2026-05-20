/**
 * JD App UI & Ad Cleanup Script (v3)
 * ===================================
 * Updated 2026-05-19 based on live MITM capture_58 analysis.
 *
 * New in v3 (on top of v2):
 *   - [BLOCK 1E+] Additional mPaaSABTest live keys now in new capture
 *     (LiveAiPopSkuCard, LiveClickRecCard, XuanjiPopSku, liveXJComponents)
 *   - [BLOCK 1J] Product page 测评 (video review) tab kill via JDProductDetail.pdcMiniVideoKey
 *   - [BLOCK 5]  superRedBagHome – "点我领奖" floating reward game icon on My JD page
 *   - [BLOCK 6]  getAllPkMsg – product page live leaderboard/PK data (直播讲解 source)
 *   - [BLOCK 7]  getTopAuthorList – product page live KOL floating card data
 *
 * Architecture note:
 *   The "直播讲解" float on product pages is fed by:
 *     (a) getTopAuthorList (returns live author/stream info per SKU)
 *     (b) LiveAiPopSkuCard mPaaSABTest flag (gates the floating card UI)
 *   The "问京言" chatbot button on product pages is a native entry point
 *   gated by the aigc_jingyan_chat / aishopping.jd.com domain.
 *   It is most reliably killed via URL reject-dict rules in the plugin file.
 *
 * Each block is self-contained and can be commented out independently.
 */

const url = $request.url;
let body;

try {
  body = JSON.parse($response.body);
} catch (e) {
  $done({});
}

// ==========================================
// 1. GLOBAL CONFIG (basicConfig)
// [VERIFIED] Present in both old and new captures.
// ==========================================
if (url.includes("functionId=basicConfig")) {
  if (body && body.data) {

    // [BLOCK 1A] Ad Snapshots & Splash Screens
    // Prevents pre-fetching of ad webviews and splash screens.
    if (body.data.elink && body.data.elink.snapshotABTest) {
      body.data.elink.snapshotABTest = {};
    }
    if (body.data.JDHybrid) {
      if (body.data.JDHybrid.snapshotCustomAB) body.data.JDHybrid.snapshotCustomAB = [];
      if (body.data.JDHybrid.snapshotFirstStartConfig) body.data.JDHybrid.snapshotFirstStartConfig = [];
      if (body.data.JDHybrid.snapshotScript) body.data.JDHybrid.snapshotScript = { v: "" };
    }

    // [BLOCK 1B] Native Tab UI Downgrade (Hide Live/Guang Tab)
    // startSwitch2026Downgrade="1" reverts the tab bar to the pre-2026 layout,
    // which removes the "逛" (live/discover) tab from the bottom navigation.
    // VERIFIED: Original capture has value="0", our script sets it to "1".
    if (body.data.JDTabBar && body.data.JDTabBar.startSwitch2026Downgrade) {
      body.data.JDTabBar.startSwitch2026Downgrade.value = "1";
    }
    // Legacy tab downgrade flags (kept for A/B rollback compatibility)
    if (body.data.showJKCTab) {
      body.data.showJKCTab.isDowngrade = "1";
    }
    if (body.data.bottomNewOrder) {
      body.data.bottomNewOrder.isDowngrade = "1";
    }
    if (body.data.BottomJumpOrder) {
      body.data.BottomJumpOrder.isDowngrade = "1";
    }
    // The showJKCTab is now nested inside JDDDIMMCU in newer app versions
    if (body.data.JDDDIMMCU) {
      if (body.data.JDDDIMMCU.showJKCTab) body.data.JDDDIMMCU.showJKCTab.isDowngrade = "1";
      if (body.data.JDDDIMMCU.showJKCCard) body.data.JDDDIMMCU.showJKCCard.isDowngrade = "1";
    }

    // [BLOCK 1C] Telemetry & Chinese HTTPDNS
    if (body.data.JDHttpToolKit && body.data.JDHttpToolKit.httpdns) {
      body.data.JDHttpToolKit.httpdns.httpdns = "0";
    }
    if (body.data.JDMessage && body.data.JDMessage.socketmonitor) {
      body.data.JDMessage.socketmonitor.isSocketEstablishedAhead = "0";
      body.data.JDMessage.socketmonitor.isSocketReport = "0";
    }

    // [BLOCK 1D] Global UI Elements Purge
    if (body.data.JDUniformRecommend) delete body.data.JDUniformRecommend;
    if (body.data.JDAD) delete body.data.JDAD;
    if (body.data.JDWidgetManager) delete body.data.JDWidgetManager;
    if (body.data.JDPopup) delete body.data.JDPopup;
    if (body.data.floatingview) delete body.data.floatingview;
    if (body.data.fans_pop_floating) delete body.data.fans_pop_floating;
    if (body.data.liveFloatingSlidingOptKey) delete body.data.liveFloatingSlidingOptKey;

    // [BLOCK 1E] Live Streaming Infrastructure Kill
    // Kills the entire live room engine, player pre-creation, channel caching,
    // KOL cards, live search cards, and the JKC master switches.
    if (body.data.liveroom) delete body.data.liveroom;
    if (body.data.mPaaSABTest) {
      // Extended AB test key list (v3: added LiveAiPopSkuCard, LiveClickRecCard,
      // XuanjiPopSku, liveXJComponents which gate the product-page live float)
      const liveABKeys = [
        "liveChannelCacheXJ", "liveChannelNewStyle", "liveChannelPreCreate",
        "liveChannelPreRequestAndPlayerPreCreate", "liveFloatingSlidingOptKey",
        "LiveChannelFollowPageUseXJ", "LiveChannelCardPlayRule",
        "LiveChannelRefactorStrategy", "LiveChannelAccelerateCardPlay",
        "LiveChannelMultipleCardPlayRule", "LiveChannelUEOptimize",
        "LiveChannelXJPlayerConfig", "liveChannelIndexImageTransitionDuration",
        "liveEnable", "liveHeadPlay", "liveMessage", "LivePrePullAsync",
        "LivePreFetchUrl", "LiveRoomBgPlayConfig", "predictLiveList",
        "LiveExpertPageUseXJ",
        // v3 new: product-page floating live card keys
        "LiveAiPopSkuCard",    // "直播讲解" floating pop card on product page
        "LiveClickRecCard",    // Live click recommendation card
        "XuanjiPopSku",        // Xuanji-powered live SKU pop card
        "liveXJComponents",    // Live XJ component list (LiveCartCell etc.)
        "VideoFeedsInsertLive",// Live card inserted in video feeds
        "LiveCartGiftXJ",      // Live cart gift component
        "LiveRoomH5UseLV",     // Live room H5 use LV
        "LiveRoomThumbExperiment", // Live room thumbnail experiment
        "LiveRoomPlayinfo",    // Live room playinfo
        "LiveRoomLoading",     // Live room loading config
        "LiveRoomBottomView",  // Live room bottom view
        "PlayControlLiveByViewSize", // Live playback control
        "LiveRoomScrollLoading",// Live room scroll loading
        "liveRankingLoad",     // Live ranking load
        "liveSearchXJ",        // Live search XJ
        "LiveCartPageXJ",      // Live cart page XJ
        "LiveWebView",         // Live webview pool config
        "LiveFlvAgcV2",        // Live FLV audio gain config
        // v1 legacy
        "v1312LiveListCache", "v1312LiveListChoiceCache",
        "v1312LiveListChoiceGuessLikeCache"
      ];
      for (const key of liveABKeys) {
        if (body.data.mPaaSABTest[key]) delete body.data.mPaaSABTest[key];
      }
    }
    // Kill live-specific video player configs
    if (body.data.JDVideoPlayer) {
      if (body.data.JDVideoPlayer.ijkplayer?.live) body.data.JDVideoPlayer.ijkplayer.live = {};
      if (body.data.JDVideoPlayer.PlayControlByViewSize?.liveAutoMultiSceneList) {
        body.data.JDVideoPlayer.PlayControlByViewSize.liveAutoMultiSceneList = [];
      }
    }
    // Kill live search cards pre-download
    if (body.data.JDSearch?.switchSearchPreDownloadTnCardInfo?.search_shop_live_card) {
      delete body.data.JDSearch.switchSearchPreDownloadTnCardInfo.search_shop_live_card;
    }

    // [BLOCK 1F] Live URL Routing Suppression
    if (body.data.JDHybrid?.["native-live-regex"]) {
      body.data.JDHybrid["native-live-regex"].data = [];
    }

    // [BLOCK 1G] Telemetry & Analytics Deep Purge
    if (body.data.jdma) {
      const trackingKills = {
        "autoTrackerEnable": { "enable": "0", "enableTapGesture": "0", "enableButton": "0", "enableMonitor": "0", "enableVCPV": "0" },
        "fingerEnable": { "enable": "0" },
        "screenCaptureEnable": { "enable": "0" },
        "screenRecordEnable": { "enable": "0" },
        "userPathEnable": { "enable": "0" },
        "userPathGzipEnable": { "enable": "0" },
        "trackLBS4AddressEnable": { "enable": "0" },
        "trackFull4AddressEnable": { "enable": "0" },
        "addressEnable": { "enable": "0" },
        "aoipoiEnable": { "enable": "0" },
        "isReport": { "report": "0" },
        "singleReportEnable": { "singleReport": "0" },
        "jdTagEnable": { "enable": "0" },
        "jdTagMonitorEnable": { "enable": "0" },
        "flowMapMonitorEnable": { "enable": "0" },
        "netListenEnable": { "enable": "0" },
        "exposureTimeEnable": { "exposure": "0" },
        "trafficMapStatusReportEnable": { "enable": "0" },
        "trafficmapBubbleExpoEnable": { "enable": "0" },
        "h5BridgePVEnable": { "enable": "0" },
        "scrollReportEnable": { "enable": "0" },
        "channelMonitorEnable": { "enable": "0" },
      };
      for (const [key, val] of Object.entries(trackingKills)) {
        if (body.data.jdma[key]) body.data.jdma[key] = val;
      }
    }
    if (body.data["Eva-Upload"]) {
      const eu = body.data["Eva-Upload"];
      if (eu["jdg-configs"]) eu["jdg-configs"].eventPushEnable = 0;
      if (eu["jdwg-config"]) {
        eu["jdwg-config"].upload = "0";
        eu["jdwg-config"].upload_bad = "0";
        eu["jdwg-config"].detect = "0";
      }
    }
    if (body.data.performanceReporter?.JDBTrackerEnable) {
      body.data.performanceReporter.JDBTrackerEnable.report = 0;
    }
    if (body.data.performanceReporter?.JDPerformance) {
      body.data.performanceReporter.JDPerformance.open_perf_flag = 0;
      body.data.performanceReporter.JDPerformance.appstart_upload_enable = 0;
    }

    // [BLOCK 1H] Local Push Notifications Kill
    if (body.data.JDOST?.LocalPush) {
      body.data.JDOST.LocalPush.switch = 0;
      body.data.JDOST.LocalPush.pushCount = 0;
    }
    if (body.data.JDBPushServiceModule?.ReportLiveAdData) {
      body.data.JDBPushServiceModule.ReportLiveAdData.enableReport = 0;
    }

    // [BLOCK 1I] Discovery / Finder Prefetch Kill
    if (body.data.JDFinderCache) {
      const fc = body.data.JDFinderCache;
      if (fc.discoverVideoPrefetch) fc.discoverVideoPrefetch.enable = "0";
      if (fc.discoverVideoQuicPrefetch) fc.discoverVideoQuicPrefetch.enable = "0";
      if (fc.recommendXuanji) fc.recommendXuanji.enable = "0";
      if (fc.productRecommendXJ) fc.productRecommendXJ.enable = "0";
      if (fc.adTipConfigs) fc.adTipConfigs = { tipSeconds: 0, maxCount: 0 };
    }

    // [BLOCK 1J] Product Page Video Review ("测评") Tab Kill
    // pdcMiniVideoKey="1" enables the 测评 (video review) tab in the product page
    // top navigation bar. Setting it to "0" disables the tab, preventing the
    // swipe-to-测评 gesture from opening the video streaming player.
    // VERIFIED: Original has pdcMiniVideoKey="1", set to "0" to disable.
    if (body.data.JDProductDetail?.pdcMiniVideoKey) {
      body.data.JDProductDetail.pdcMiniVideoKey.pdcMiniVideoKey = "0";
    }

    // [BLOCK 1K] AI Chatbot (问京言) Global Config Suppression
    if (body.data.AIShopping) delete body.data.AIShopping;
    if (body.data.JDMessage && body.data.JDMessage.AIChat) {
      body.data.JDMessage.AIChat.enableShowAIChatFavorite = "0";
      body.data.JDMessage.AIChat.enableFavoriteGuide = "0";
    }
    if (body.data.JDJMA?.function) {
      body.data.JDJMA.function.endAIOpen = 0;
    }
    if (body.data.JDRiskHandle) {
      body.data.JDRiskHandle.endAIState = null;
      body.data.JDRiskHandle.timeIntervalEndAI = null;
      if (body.data.JDRiskHandle.fatigueConfig) {
        body.data.JDRiskHandle.fatigueConfig.endAI = null;
      }
    }
  }
}

// ==========================================
// 2. SECOND FLOOR – Pull-down hidden page
// [VERIFIED] Endpoint: secondFloor
// ==========================================
else if (url.includes("functionId=secondFloor")) {
  if (body?.data) {
    if (body.data.recommendFloor) body.data.recommendFloor = null;
    if (body.data.remindFloor && body.data.remindFloor.floorList) {
      body.data.remindFloor.floorList = [];
    }
  }
}

// ==========================================
// 3. GAME ICON – Floating treasure box widget
// [VERIFIED] Endpoint: weGameIcon (called 16x per session!)
// ==========================================
else if (url.includes("functionId=weGameIcon")) {
  if (body?.data?.iconVo) {
    body.data.iconVo.state = -1;
    body.data.iconVo.show = null;
    body.data.iconVo.popupFlag = 0;
    body.data.iconVo.animatedFlag = 0;
  }
}

// ==========================================
// 4. MARKETING RESOURCE – Promotional content
// [VERIFIED] Endpoint: bff_marketing_resource
// ==========================================
else if (url.includes("functionId=bff_marketing_resource")) {
  if (body?.rs) {
    if (body.rs.tabList) body.rs.tabList = [];
    if (body.rs.saveMoneyInfoVo) delete body.rs.saveMoneyInfoVo;
  }
}

// ==========================================
// 5. REWARD GAME ICON – "点我领奖" floating widget on My JD page
// [NEW v3] Endpoint: superRedBagHome
// This endpoint controls the floating game/lottery icon that appears in
// the bottom-right of the "我的" (My JD) profile page. The icon opens
// an in-app game ("东东农场", 签到领奖, lottery, etc.)
// Setting showQuickLotteryIconFlag=false hides the floating icon.
// Setting dailyLotteryVo=null prevents the daily lottery widget from rendering.
// ==========================================
else if (url.includes("functionId=superRedBagHome")) {
  if (body?.data) {
    // Hide quick lottery icon
    if (body.data.showQuickLotteryIconFlag !== undefined) {
      body.data.showQuickLotteryIconFlag = false;
    }
    if (body.data.showQuickLotteryStartAnimation !== undefined) {
      body.data.showQuickLotteryStartAnimation = false;
    }
    // Null out the daily lottery widget data
    if (body.data.dailyLotteryVo !== undefined) {
      body.data.dailyLotteryVo = null;
    }
    // Null out any prize draw data
    if (body.data.prizeDrawVo !== undefined) {
      body.data.prizeDrawVo = null;
    }
  }
}

// ==========================================
// 6. PRODUCT PAGE LIVE LEADERBOARD – "直播讲解" source data
// [NEW v3] Endpoint: getAllPkMsg (wh5 client)
// This endpoint is called from within the product detail page (wh5 context)
// and returns the live streaming PK/leaderboard data. The "直播讲解"
// floating card on the product page is populated using this data.
// Setting activityName to null and clearing host/graph data disables the card.
// ==========================================
else if (url.includes("functionId=getAllPkMsg")) {
  if (body?.data) {
    // Null out the live activity data to prevent the floating live card
    body.data.activityHostGraph = null;
    body.data.activityName = null;
    body.data.tracks = [];
    body.data.firePowerType = -1;
  }
}

// ==========================================
// 7. PRODUCT PAGE LIVE KOL FLOAT – "直播讲解" author card source
// [NEW v3] Endpoint: getTopAuthorList (wh5 client)
// Returns the list of live streaming authors/KOLs associated with a SKU.
// The "直播讲解" floating widget on product pages reads this list to show
// a live host card when a relevant author is streaming.
// Returning an empty list prevents the card from appearing.
// ==========================================
else if (url.includes("functionId=getTopAuthorList")) {
  // Return empty author list to suppress the live author float card
  if (Array.isArray(body?.data)) {
    body.data = [];
  }
  if (body?.data && !Array.isArray(body.data)) {
    if (body.data.authorList) body.data.authorList = [];
    if (body.data.list) body.data.list = [];
  }
}

// ==========================================
// 8. [LEGACY] LOGISTICS & ORDER TRACKING PAGE
// Endpoints: deliverLayer, orderTrackBusiness
// NOT seen in May 2026 capture. Kept as fallback.
// ==========================================
else if (url.includes("functionId=deliverLayer") || url.includes("functionId=orderTrackBusiness")) {
  if (body?.bannerInfo) {
    delete body.bannerInfo;
  }
  if (body?.floors?.length > 0) {
    body.floors = body.floors.filter((i) => !["banner", "jdDeliveryBanner"]?.includes(i?.mId));
  }
}

// ==========================================
// 9. [LEGACY] NEW PRODUCT / TAB HOME PAGE
// Endpoint: getTabHomeInfo
// NOT seen in new capture. Kept as fallback.
// ==========================================
else if (url.includes("functionId=getTabHomeInfo")) {
  if (body?.result) {
    delete body.result.iconInfo;
    delete body.result.roofTop;
  }
}

// ==========================================
// 10. [LEGACY] ORDER LIST PAGE
// Endpoint: myOrderInfo
// NOT seen in new capture. Kept as fallback.
// ==========================================
else if (url.includes("functionId=myOrderInfo")) {
  if (body?.floors?.length > 0) {
    let newFloors = [];
    for (let floor of body.floors) {
      const dropFloors = ["bannerFloor", "bpDynamicFloor", "plusFloor"];
      if (dropFloors.includes(floor?.mId)) {
        continue;
      }
      if (floor?.mId === "virtualServiceCenter" && floor?.data?.virtualServiceCenters?.length > 0) {
        let newItems = [];
        for (let item of floor.data.virtualServiceCenters) {
          if (item?.serviceList?.length > 0) {
            item.serviceList = item.serviceList.filter(card => card?.serviceTitle !== "精选特惠");
          }
          newItems.push(item);
        }
        floor.data.virtualServiceCenters = newItems;
      }
      if (floor?.mId === "customerServiceFloor" && floor?.data?.moreText) {
        delete floor.data.moreIcon;
        delete floor.data.moreIcon_dark;
        floor.data.moreText = " ";
      }
      newFloors.push(floor);
    }
    body.floors = newFloors;
  }
}

// ==========================================
// 11. [LEGACY] PERSONAL INFO (MY JD) PAGE
// Endpoint: personinfoBusiness
// NOT seen in new capture. Kept as fallback.
// ==========================================
else if (url.includes("functionId=personinfoBusiness")) {
  if (body?.floors?.length > 0) {
    let newFloors = [];
    for (let floor of body.floors) {
      const purgeItems = [
        "bigSaleFloor",          // Double 11 / Big Sale promos
        "buyOften",              // Frequently bought/visited
        "newAttentionCard",      // Followed channels
        "newBigSaleFloor",       // New Big Sale promo
        "newStyleAttentionCard", // New followed channels
        "newsFloor",             // JD News
        "noticeFloor",           // Top banners
        "recommendfloor",        // "My Recommendations"
        "iconToolFloor",         // Bottom toolbar mini-games
      ];
      if (purgeItems.includes(floor?.mId)) {
        continue;
      }
      if (floor?.mId === "basefloorinfo") {
        delete floor?.data?.commonPopup;
        delete floor?.data?.commonPopup_dynamic;
        delete floor?.data?.floatLayer;
        if (floor?.data?.commonTips) floor.data.commonTips = [];
        if (floor?.data?.commonWindows) floor.data.commonWindows = [];
      } else if (floor?.mId === "orderIdFloor") {
        if (floor?.data?.commentRemindInfo?.infos) floor.data.commentRemindInfo.infos = [];
      } else if (floor?.mId === "userinfo") {
        delete floor?.data?.newPlusBlackCard;
      }
      newFloors.push(floor);
    }
    body.floors = newFloors;
  }
}

// ==========================================
// 12. [LEGACY] HOMEPAGE (welcomeHome)
// Endpoint: welcomeHome
// NOT seen in new capture. Kept as fallback.
// ==========================================
else if (url.includes("functionId=welcomeHome")) {
  if (body?.floorList?.length > 0) {
    const purgeItems = [
      "bottomXview",      // Bottom float
      "float",            // Small circular float
      "photoCeiling",     // Top animated banner
      "recommend",        // For you recommendations
      "ruleFloat",        // Rules float
      "searchIcon",       // Top right voucher icon
      "topRotate",        // Top left animated logo
      "tabBarAtmosphere"  // Bottom nav effects
    ];
    body.floorList = body.floorList.filter((i) => !purgeItems.includes(i?.type));
  }
  if (body?.webViewFloorList?.length > 0) {
    body.webViewFloorList = [];
  }
}

// ==========================================
// 13. [LEGACY] START/SPLASH SCREEN
// Endpoint: start
// NOT seen in new capture. Splash ads now controlled
// via elink/JDHybrid in basicConfig (Block 1A).
// ==========================================
else if (url.includes("functionId=start")) {
  if (body?.images?.length > 0) body.images = [];
  if (body?.showTimesDaily) body.showTimesDaily = 0;
}

// ==========================================
// 14. PRODUCT TITLE AI CHATBOT LINKS – 问京言 inline links
// [NEW v3] Endpoint: sku_interp_title
// Clear the data array to remove AI chatbot text links in the title
// ==========================================
else if (url.includes("functionId=sku_interp_title")) {
  if (body?.data) {
    body.data = [];
  }
}

// ==========================================
// 15. GAME DASHBOARD / USER FISSION INFO
// [NEW v3] Endpoints: weGameHome, weGamePushQuery
// Controls game center fission tasks, rewards, and user mini-game pushes.
// Returning empty/disabled data suppresses the mini-game widgets.
// ==========================================
else if (url.includes("functionId=weGameHome") || url.includes("functionId=weGamePushQuery")) {
  if (body?.data) {
    body.data = {};
  }
}

// ==========================================
// 16. PET GAME WIDGET INFO
// [NEW v3] Endpoint: petHome (Dongdong Pet)
// Controls rendering of the Dongdong Pet mini-game widget.
// Returning code: 0 and bizCode: -1 disables the pet widget.
// ==========================================
else if (url.includes("functionId=petHome")) {
  if (body) {
    body.code = 0;
    body.data = { bizCode: -1, bizMsg: "Disabled" };
  }
}

$done({ body: JSON.stringify(body) });
