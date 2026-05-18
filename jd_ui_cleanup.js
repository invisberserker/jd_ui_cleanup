/**
 * JD App UI & Ad Cleanup Script (v2)
 * ===================================
 * Updated 2026-05-19 based on live MITM capture analysis.
 *
 * Key finding: JD has migrated away from the old functionId endpoints
 * (welcomeHome, personinfoBusiness, myOrderInfo, start, etc.).
 * Those are kept as [LEGACY] blocks for A/B test fallback.
 *
 * Each block is self-contained and can be commented out independently
 * if it breaks something essential.
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
    // To restore: comment out the 3 lines below.
    if (body.data.elink && body.data.elink.snapshotABTest) {
      body.data.elink.snapshotABTest = {};
    }
    if (body.data.JDHybrid) {
      if (body.data.JDHybrid.snapshotCustomAB) body.data.JDHybrid.snapshotCustomAB = [];
      if (body.data.JDHybrid.snapshotFirstStartConfig) body.data.JDHybrid.snapshotFirstStartConfig = [];
      if (body.data.JDHybrid.snapshotScript) body.data.JDHybrid.snapshotScript = { v: "" };
    }

    // [BLOCK 1B] Native Tab UI Downgrade (Hide Live/Guang Tab)
    // Forces the app into a legacy layout to hide dynamic tabs.
    // To restore: comment out the 4 if-blocks below.
    if (body.data.JDTabBar && body.data.JDTabBar.startSwitch2026Downgrade) {
      body.data.JDTabBar.startSwitch2026Downgrade.value = "1";
    }
    if (body.data.showJKCTab) {
      body.data.showJKCTab.isDowngrade = "1";
    }
    if (body.data.bottomNewOrder) {
      body.data.bottomNewOrder.isDowngrade = "1";
    }
    if (body.data.BottomJumpOrder) {
      body.data.BottomJumpOrder.isDowngrade = "1";
    }

    // [BLOCK 1C] Telemetry & Chinese HTTPDNS
    // Disables DNS tracking and socket reporting.
    // To restore: comment out the 2 if-blocks below.
    if (body.data.JDHttpToolKit && body.data.JDHttpToolKit.httpdns) {
      body.data.JDHttpToolKit.httpdns.httpdns = "0";
    }
    if (body.data.JDMessage && body.data.JDMessage.socketmonitor) {
      body.data.JDMessage.socketmonitor.isSocketEstablishedAhead = "0";
      body.data.JDMessage.socketmonitor.isSocketReport = "0";
    }

    // [BLOCK 1D] Global UI Elements Purge
    // Removes JD's unified recommend engine, ad module, widgets, and popups.
    // To restore: comment out individual delete lines.
    if (body.data.JDUniformRecommend) delete body.data.JDUniformRecommend;
    if (body.data.JDAD) delete body.data.JDAD;
    if (body.data.JDWidgetManager) delete body.data.JDWidgetManager;
    if (body.data.JDPopup) delete body.data.JDPopup;
    if (body.data.floatingview) delete body.data.floatingview;
    if (body.data.fans_pop_floating) delete body.data.fans_pop_floating;
    if (body.data.liveFloatingSlidingOptKey) delete body.data.liveFloatingSlidingOptKey;

    // [BLOCK 1E] Live Streaming Infrastructure Kill
    // Nukes the entire live room engine (39 config keys), live player
    // pre-creation, channel caching, KOL cards, live search cards,
    // and the JDDDIMMCU master switches for the 逛 (Live) tab/card.
    // JD embeds a full Twitch-class streaming platform (157 live-related
    // keys) inside a shopping app. This block disables it at the root.
    // To restore: comment out the entire block below.
    if (body.data.liveroom) delete body.data.liveroom;
    if (body.data.JDDDIMMCU) {
      if (body.data.JDDDIMMCU.showJKCTab) body.data.JDDDIMMCU.showJKCTab.isDowngrade = "1";
      if (body.data.JDDDIMMCU.showJKCCard) body.data.JDDDIMMCU.showJKCCard.isDowngrade = "1";
    }
    if (body.data.mPaaSABTest) {
      // Kill all live channel pre-creation, caching, floating, and style configs
      const liveABKeys = [
        "liveChannelCacheXJ", "liveChannelNewStyle", "liveChannelPreCreate",
        "liveChannelPreRequestAndPlayerPreCreate", "liveFloatingSlidingOptKey",
        "LiveChannelFollowPageUseXJ", "LiveChannelCardPlayRule",
        "LiveChannelRefactorStrategy", "LiveChannelAccelerateCardPlay",
        "LiveChannelMultipleCardPlayRule", "LiveChannelUEOptimize",
        "LiveChannelXJPlayerConfig", "liveChannelIndexImageTransitionDuration",
        "liveEnable", "liveHeadPlay", "liveMessage", "LivePrePullAsync",
        "LivePreFetchUrl", "LiveRoomBgPlayConfig", "predictLiveList",
        "LiveExpertPageUseXJ", "LiveAiPopSkuCard", "LiveClickRecCard",
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
    // JDHybrid.native-live-regex routes lives.jd.com URLs to the native
    // live player. Clearing the regex array makes live links open in
    // a regular webview instead (or simply fail gracefully).
    // To restore: comment out the if-block below.
    if (body.data.JDHybrid?.["native-live-regex"]) {
      body.data.JDHybrid["native-live-regex"].data = [];
    }

    // [BLOCK 1G] Telemetry & Analytics Deep Purge
    // jdma (28KB, 105 keys) is JD's analytics motherlode: auto-tracking
    // taps/scrolls/screen captures/user path recording/fingerprinting/
    // location tracking. Eva-Upload is device telemetry push. 
    // performanceReporter is perf metrics reporting.
    // To restore: comment out individual module deletes.
    if (body.data.jdma) {
      // Disable core tracking switches instead of deleting the module
      // (deleting entirely may crash the analytics SDK)
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
    // Eva-Upload: device telemetry & JD Guard data collection
    if (body.data["Eva-Upload"]) {
      const eu = body.data["Eva-Upload"];
      if (eu["jdg-configs"]) eu["jdg-configs"].eventPushEnable = 0;
      if (eu["jdwg-config"]) {
        eu["jdwg-config"].upload = "0";
        eu["jdwg-config"].upload_bad = "0";
        eu["jdwg-config"].detect = "0";
      }
    }
    // performanceReporter
    if (body.data.performanceReporter?.JDBTrackerEnable) {
      body.data.performanceReporter.JDBTrackerEnable.report = 0;
    }
    if (body.data.performanceReporter?.JDPerformance) {
      body.data.performanceReporter.JDPerformance.open_perf_flag = 0;
      body.data.performanceReporter.JDPerformance.appstart_upload_enable = 0;
    }

    // [BLOCK 1H] Local Push Notifications Kill
    // JDOST.LocalPush fires local notifications (up to 2 per 3 requests)
    // even when offline. Pure nag-ware.
    // To restore: comment out the if-block below.
    if (body.data.JDOST?.LocalPush) {
      body.data.JDOST.LocalPush.switch = 0;
      body.data.JDOST.LocalPush.pushCount = 0;
    }
    // JDBPushServiceModule.ReportLiveAdData - live ad push reporting
    if (body.data.JDBPushServiceModule?.ReportLiveAdData) {
      body.data.JDBPushServiceModule.ReportLiveAdData.enableReport = 0;
    }

    // [BLOCK 1I] Discovery / Finder Prefetch Kill
    // JDFinderCache controls the "Discover" (发现) tab's video/content
    // prefetch engine, product recommendation cards, and ad tip popups.
    // To restore: comment out individual lines.
    if (body.data.JDFinderCache) {
      const fc = body.data.JDFinderCache;
      if (fc.discoverVideoPrefetch) fc.discoverVideoPrefetch.enable = "0";
      if (fc.discoverVideoQuicPrefetch) fc.discoverVideoQuicPrefetch.enable = "0";
      if (fc.recommendXuanji) fc.recommendXuanji.enable = "0";
      if (fc.productRecommendXJ) fc.productRecommendXJ.enable = "0";
      if (fc.adTipConfigs) fc.adTipConfigs = { tipSeconds: 0, maxCount: 0 };
    }
  }
}

// ==========================================
// 2. SECOND FLOOR – Pull-down hidden page
// [VERIFIED] Endpoint: secondFloor
// Captured in new session. Contains recommendFloor
// (product promotions) and remindFloor (红包/benefits/trial
// reminder cards) that push content on accidental pull-down.
// ==========================================
else if (url.includes("functionId=secondFloor")) {
  if (body?.data) {
    // [BLOCK 2A] Remove recommendation floor (product promos)
    // To restore: comment out the line below.
    if (body.data.recommendFloor) body.data.recommendFloor = null;

    // [BLOCK 2B] Clear reminder floor cards (红包, benefits, trial)
    // To restore: comment out the line below.
    if (body.data.remindFloor && body.data.remindFloor.floorList) {
      body.data.remindFloor.floorList = [];
    }
  }
}

// ==========================================
// 3. GAME ICON – Floating treasure box widget
// [VERIFIED] Endpoint: weGameIcon (called 16x per session!)
// Constantly polls to show a floating game icon overlay.
// We force state=-1 (hidden) regardless of server response.
// ==========================================
else if (url.includes("functionId=weGameIcon")) {
  if (body?.data?.iconVo) {
    // [BLOCK 3A] Force game icon hidden
    // To restore: comment out the 4 lines below.
    body.data.iconVo.state = -1;
    body.data.iconVo.show = null;
    body.data.iconVo.popupFlag = 0;
    body.data.iconVo.animatedFlag = 0;
  }
}

// ==========================================
// 4. MARKETING RESOURCE – Promotional content
// [VERIFIED] Endpoint: bff_marketing_resource
// Returns product promotion tabs and "save money" info.
// ==========================================
else if (url.includes("functionId=bff_marketing_resource")) {
  // [BLOCK 4A] Nullify marketing content
  // To restore: comment out the if-block below.
  if (body?.rs) {
    if (body.rs.tabList) body.rs.tabList = [];
    if (body.rs.saveMoneyInfoVo) delete body.rs.saveMoneyInfoVo;
  }
}

// ==========================================
// 5. [LEGACY] LOGISTICS & ORDER TRACKING PAGE
// Endpoints: deliverLayer, orderTrackBusiness
// NOT seen in new capture (May 2026). Kept as fallback
// in case JD A/B tests or rolls back to these endpoints.
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
// 6. [LEGACY] NEW PRODUCT / TAB HOME PAGE
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
// 7. [LEGACY] ORDER LIST PAGE
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
// 8. [LEGACY] PERSONAL INFO (MY JD) PAGE
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
// 9. [LEGACY] HOMEPAGE (welcomeHome)
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
// 10. [LEGACY] START/SPLASH SCREEN
// Endpoint: start
// NOT seen in new capture. Splash ads now controlled
// via elink/JDHybrid in basicConfig (Block 1A).
// ==========================================
else if (url.includes("functionId=start")) {
  if (body?.images?.length > 0) body.images = [];
  if (body?.showTimesDaily) body.showTimesDaily = 0;
}

$done({ body: JSON.stringify(body) });
