module.exports = function(s,config,lang){
    const {
        Theme,
        textWhiteOnBgDark,
        mainBackgroundColor,
    } = require('../baseUtils.js')(s,config,lang)
    return {
        "section": "Monitor Settings",
        "blocks": {
            "Page Control": {
               name: lang.Monitor,
               headerTitle: `<div class="monitorSettings-title">Monitor Settings : <span>Add New</span></div>`,
              "color": "blue",
               isSection: false,
              "info": [
                  {
                      "field": lang.Monitor,
                      "fieldType": "select",
                      "class": "monitors_list",
                      "possible": []
                  }
              ]
           },
           "Identity": {
              "name": lang.Identity,
              "color": "grey",
              "isSection": true,
              "id":"monSectionIdentity",
              "blockquoteClass": "global_tip",
              "blockquote": `<div class="am_notice am_notice_new">${lang.IdentityText1}</div><div class="am_notice am_notice_edit">${lang.IdentityText2}</div>`,
              "info": [
                 {
                    "name": "mode",
                    "field": lang.Mode,
                    "fieldType": "select",
                    "description": lang["fieldTextMode"],
                    "default": "start",
                    "example": "",
                    "selector": "h_m",
                    "possible": [
                       {
                          "name": lang.Disabled,
                          "value": "stop",
                          "info": lang["fieldTextModeDisabled"]
                       },
                       {
                          "name": lang["Watch-Only"],
                          "value": "start",
                          "info": lang["fieldTextModeWatchOnly"]
                       },
                       {
                          "name": lang.Record,
                          "value": "record",
                          "info": lang["fieldTextModeRecord"]
                       },
                       {
                          "name": lang.Idle,
                          "value": "idle",
                          "info": ""
                       }
                    ]
                 },
                 {
                    "name": "mid",
                    "field": lang["Monitor ID"],
                    "description": lang["fieldTextMid"],
                    "example": s.gid()
                 },
                 {
                    "name": "name",
                    "field": lang.Name,
                    "description": lang["fieldTextName"],
                    "example": "Home-Front"
                 },
                 {
                    "name": "tags",
                    "field": lang['Tags'],
                    "description": lang.tagsFieldText,
                 },
                 {
                    "name": "detail=max_keep_days",
                    "field": lang["Number of Days to keep"] + ' ' + lang['Videos'],
                    "placeholder": "Default is Global value.",
                    "description": lang["fieldTextMaxKeepDays"],
                 },
                 {
                    "name": "detail=notes",
                    "field": lang.Notes,
                    "description": lang["fieldTextNotes"],
                    "fieldType": "textarea",
                 },
                 {
                    "name": "detail=icon",
                    "field": lang['Custom Icon'],
                    "example": "http://my.website/icon.jpg",
                 },
                 {
                    "name": "detail=dir",
                    "field": lang["Storage Location"],
                    "description": lang["fieldTextDir"],
                    "fieldType": "select",
                    "possible": s.listOfStorage
                },
                {
                   "name": "detail=auto_compress_videos",
                   "field": lang['Compress Completed Videos'],
                   "description": lang.compressCompletedVideosFieldText,
                   "fieldType": "select",
                   "possible": [
                       {
                          "name": lang.No,
                          "value": "0"
                       },
                       {
                          "name": lang.Yes,
                          "value": "1"
                       }
                   ]
                }
              ]
           },
           "Connection": {
              "name": lang.Connection,
              "color": "orange",
              "id": "monSectionConnection",
              "isSection": true,
              "blockquote":`<p>${lang.InputText1}</p>\
              ${lang.InputText2}\
              <p>${lang.InputText3}</p>`,
              "blockquoteClass":"global_tip",
              "info": [
                  {
                     "name": "type",
                     "fieldType": "select",
                     "selector": "h_t",
                     "field": lang["Input Type"],
                     "description": lang["fieldTextType"],
                     "default": "h264",
                     "example": "",
                     "possible": [
                          {
                             "name": "H.264 / H.265 / H.265+",
                             "value": "h264",
                             "info": lang["fieldTextTypeH.264/H.265/H.265+"]
                          },
                          {
                             "name": "HLS (.m3u8)",
                             "value": "hls",
                             "info": lang["fieldTextTypeHLS(.m3u8)"]
                          },
                          {
                             "name": "MPEG-4 (.mp4 / .ts)",
                             "value": "mp4",
                             "info": lang["fieldTextTypeMPEG4(.mp4/.ts)"]
                          },
                          {
                             "name": "Shinobi Streamer",
                             "value": "socket",
                             "info": lang["fieldTextTypeShinobiStreamer"]
                          },
                          {
                             "name": "Dashcam (Streamer v2)",
                             "value": "dashcam",
                             "info": lang["fieldTextTypeDashcam(StreamerV2)"]
                          },
                          {
                             "name": lang.Local,
                             "value": "local",
                             "info": lang["fieldTextTypeLocal"]
                          },
                          {
                             "evaluation": "!!config.rtmpServer",
                             "name": "RTMP",
                             "value": "rtmp",
                             "info": `Learn to connect here : <a href="https://shinobi.video/articles/2019-02-14-how-to-push-streams-to-shinobi-with-rtmp" target="_blank">Article : How to Push Streams via RTMP to Shinobi</a>`
                          }
                       ]
                  },
                  {
                      hidden:true,
                     "name": "detail=rtmp_key",
                     "form-group-class": "h_t_input h_t_rtmp",
                     "field": lang['Stream Key'],
                     "description": lang["fieldTextRtmpKey"]
                  },
                  {
                      hidden:true,
                     "name": "detail=auto_host_enable",
                     "field": lang.Automatic,
                     "description": lang["fieldTextAutoHostEnable"],
                     "selector": "h_auto_host",
                     "form-group-class": "h_t_input h_t_h264 h_t_hls h_t_mp4 h_t_jpeg h_t_mjpeg h_t_mxpeg",
                     "form-group-class-pre-layer":"h_t_input h_t_h264 h_t_hls h_t_mp4 h_t_jpeg h_t_mjpeg h_t_mxpeg h_t_local",
                     "fieldType": "select",
                     "possible": [
                         {
                            "name": lang.No,
                            "value": "0"
                         },
                         {
                            "name": lang.Yes,
                            "value": "1"
                         }
                     ]
                  },
                  {
                      hidden:true,
                     "name": "detail=auto_host",
                     "field": lang["Full URL Path"],
                     "form-group-class": "h_auto_host_input h_auto_host_1",
                     "description": lang["fieldTextAutoHost"],
                     "default": "",
                     "example": "rtsp://username:password@123.123.123.123/stream/1",
                     "possible": ""
                  },
                  {
                      hidden:true,
                     "name": "protocol",
                     "field": lang["Connection Type"],
                     "description": lang["fieldTextProtocol"],
                     "default": "RTSP",
                     "example": "",
                     "form-group-class": "h_t_input h_t_h264 h_t_hls h_t_mp4 h_t_jpeg h_t_mjpeg",
                     "form-group-class-pre-layer": "h_auto_host_input h_auto_host_0 auto_host_fill",
                     "fieldType": "select",
                     "possible": [
                         {
                            "name": "HTTP",
                            "value": "http"
                         },
                         {
                            "name": "HTTPS",
                            "value": "https"
                         },
                         {
                            "name": "RTSP",
                            "value": "rtsp"
                         },
                         {
                            "name": "RTMP",
                            "value": "rtmp"
                         },
                         {
                            "name": "RTMPS",
                            "value": "rtmps"
                         },
                         {
                            "name": "UDP",
                            "value": "udp"
                         }
                      ]
                  },
                  {
                      hidden:true,
                     "name": "detail=rtsp_transport",
                     "field": lang["RTSP Transport"],
                     "description": lang["fieldTextRtspTransport"],
                     "default": "",
                     "example": "",
                     "form-group-class": "h_t_input h_t_h264 h_t_hls h_t_mp4 h_t_jpeg h_t_mjpeg",
                     "form-group-class-pre-layer":"h_p_input h_p_rtsp",
                     "form-group-class-pre-pre-layer":"h_auto_host_input h_auto_host_0 auto_host_fill",
                     "fieldType": "select",
                     "possible": [
                         {
                            "name": lang.Auto,
                            "value": "no",
                            "info": lang["fieldTextRtspTransportAuto"]
                         },
                         {
                            "name": "TCP",
                            "value": "tcp",
                            "info": lang["fieldTextRtspTransportTCP"]
                         },
                         {
                            "name": "UDP",
                            "value": "udp",
                            "info": lang["fieldTextRtspTransportUDP"]
                         },
                         {
                            "name": "HTTP",
                            "value": "http",
                            "info": lang["fieldTextRtspTransportHTTP"]
                         }
                      ]
                  },
                  {
                      hidden:true,
                     "name": "detail=muser",
                     "field": lang.Username,
                     "description": lang["fieldTextMuser"],
                     "default": "",
                     "example": "kittenFinder",
                     "form-group-class": "h_t_input h_t_h264 h_t_hls h_t_mp4 h_t_jpeg h_t_mjpeg",
                     "form-group-class-pre-layer": "h_auto_host_input h_auto_host_0 auto_host_fill",
                     "possible": ""
                  },
                  {
                      hidden:true,
                     "name": "detail=mpass",
                     "fieldType": "password",
                     "field": lang.Password,
                     "description": lang["fieldTextMpass"],
                     "default": "",
                     "example": "kittenCuddler",
                     "form-group-class": "h_t_input h_t_h264 h_t_hls h_t_mp4 h_t_jpeg h_t_mjpeg",
                     "form-group-class-pre-layer": "h_auto_host_input h_auto_host_0 auto_host_fill",
                     "possible": ""
                  },
                  {
                      hidden:true,
                     "name": "host",
                     "field": lang.Host,
                     "description": lang["fieldTextHost"],
                     "default": "",
                     "example": "111.111.111.111",
                     "form-group-class": "h_t_input h_t_h264 h_t_hls h_t_mp4 h_t_jpeg h_t_mjpeg",
                     "form-group-class-pre-layer": "h_auto_host_input h_auto_host_0 auto_host_fill",
                     "possible": ""
                  },
                  {
                      hidden:true,
                     "name": "port",
                     "field": lang.Port,
                     "description": lang["fieldTextPort"],
                     "default": "80",
                     "example": "554",
                     "possible": "1-65535",
                     "form-group-class": "h_t_input h_t_h264 h_t_hls h_t_mp4 h_t_jpeg h_t_mjpeg",
                     "form-group-class-pre-layer": "h_auto_host_input h_auto_host_0 auto_host_fill",
                  },
                  {
                      hidden:true,
                     "name": "detail=port_force",
                     "field": lang["Force Port"],
                     "description": lang["fieldTextPortForce"],
                     "default": "0",
                     "example": "",
                     "form-group-class": "h_t_input h_t_h264 h_t_hls h_t_mp4 h_t_jpeg h_t_mjpeg",
                     "form-group-class-pre-layer": "h_auto_host_input h_auto_host_0 auto_host_fill",
                     "fieldType": "select",
                     "possible": [
                         {
                            "name": lang.No,
                            "value": "0"
                         },
                         {
                            "name": lang.Yes,
                            "value": "1"
                         }
                     ]
                  },
                  {
                      hidden:true,
                     "name": "path",
                     "field": lang.Path,
                     "description": lang["fieldTextPath"],
                     "default": "",
                     "example": "/videostream.cgi?1",
                     "possible": "",
                     "form-group-class": "h_t_input h_t_h264 h_t_hls h_t_mp4 h_t_jpeg h_t_mjpeg h_t_local",
                     "form-group-class-pre-layer": "h_auto_host_input h_auto_host_0 auto_host_fill",
                  },
                  {
                     "name": "detail=fatal_max",
                     "field": lang['Retry Connection'],
                     "description": lang["fieldTextFatalMax"],
                     "example": "10",
                  },
                  {
                     "name": "detail=skip_ping",
                     "field": lang['Skip Ping'],
                     "description": lang["fieldTextSkipPing"],
                     "default": "0",
                     "example": "",
                     "fieldType": "select",
                     "possible": [
                         {
                            "name": lang.No,
                            "value": "0"
                         },
                         {
                            "name": lang.Yes,
                            "value": "1"
                         }
                     ]
                  },
                  {
                     "name": "detail=is_onvif",
                     "field": lang.ONVIF,
                     "description": lang["fieldTextIsOnvif"],
                     "default": "0",
                     "example": "",
                     "selector": "h_onvif",
                     "fieldType": "select",
                     "possible": [
                         {
                            "name": lang.No,
                            "value": "0"
                         },
                         {
                            "name": lang.Yes,
                            "value": "1"
                         }
                     ]
                  },
                  {
                     "name": "detail=onvif_non_standard",
                     "field": lang['Non-Standard ONVIF'],
                     "description": lang["fieldTextOnvifNonStandard"],
                     "default": "0",
                     "example": "",
                     "form-group-class": "h_onvif_input h_onvif_1",
                     "fieldType": "select",
                     "possible": [
                         {
                            "name": lang.No,
                            "value": "0"
                         },
                         {
                            "name": lang.Yes,
                            "value": "1"
                         }
                     ]
                  },
                  {
                      hidden: true,
                     "name": "detail=onvif_port",
                     "field": lang['ONVIF Port'],
                     "description": `ONVIF is usually run on port <code>8000</code>. This can be <code>80</code> as well depending on your camera model.`,
                     "default": "8000",
                     "example": "",
                     "form-group-class": "h_onvif_input h_onvif_1",
                  },
                  {
                     "fieldType": "btn",
                     "class": `btn-success probe_config`,
                     "btnContent": `<i class="fa fa-search"></i> &nbsp; ${lang.FFprobe}`,
                  },
                  {
                     "fieldType": "btn",
                     "attribute": `style="margin-top:1rem"`,
                     "form-group-class-pre-layer": "h_onvif_input h_onvif_1",
                     "class": `btn-warning am_notice_edit open-onvif-device-manager`,
                     "btnContent": `<i class="fa fa-gears"></i> &nbsp; ${lang['ONVIF Device Manager']}`,
                  },
              ]
          },
           "Input": {
              "name": lang.Input,
              "color": "forestgreen",
              "id": "monSectionInput",
              "isSection": true,
              "info": [
                 {
                     hidden:true,
                    "name": "detail=primary_input",
                    "field": lang['Primary Input'],
                    "description": "",
                    "default": "0:0",
                    "example": "",
                    "fieldType": "select",
                    "form-group-class": "input-mapping",
                    "possible": [
                         {
                            "name": lang['All streams in first feed'] + ' (0, ' + lang.Default + ')',
                            "value": "0"
                         },
                         {
                            "name": lang['First stream in feed'] + ' (0:0)',
                            "value": "0:0"
                         },
                         {
                            "name": lang['Second stream in feed'] + " (0:1)",
                            "value": "0:1"
                         },
                         {
                            "name": lang['Video streams only'] + " (0:v)",
                            "value": "0:v"
                         },
                         {
                            "name": lang['Video stream only from first feed'] + " (0:v:0)",
                            "value": "0:v:0"
                         }
                      ]
                 },
                 {
                    "name": "detail=aduration",
                    "field": lang["Analyzation Duration"],
                    "description": lang["fieldTextAduration"],
                    "default": "",
                    "example": "100000",
                    "possible": ""
                 },
                 {
                    "name": "detail=probesize",
                    "field": lang["Probe Size"],
                    "description": lang["fieldTextProbesize"],
                    "default": "",
                    "example": "100000",
                    "possible": ""
                 },
                 {
                     hidden: true,
                    "name": "detail=stream_loop",
                    "field": lang['Loop Stream'],
                    "description": lang["fieldTextStreamLoop"],
                    "default": "1",
                    "example": "",
                    "form-group-class": "h_t_input h_t_mp4 h_t_local",
                    "fieldType": "select",
                    "possible": [
                        {
                           "name": lang.No,
                           "value": "0"
                        },
                        {
                           "name": lang.Yes,
                           "value": "1"
                        }
                    ]
                 },
                 {
                     isAdvanced: true,
                    "name": "detail=audio_only",
                    "field": lang['Audio Only'],
                    "default": "0",
                    "fieldType": "select",
                    "selector": "h_audio_only",
                    "possible": [
                        {
                           "name": lang.No,
                           "value": "0"
                        },
                        {
                           "name": lang.Yes,
                           "value": "1"
                        }
                    ]
                 },
                 {
                    "name": "detail=wall_clock_timestamp_ignore",
                    "field": lang['Use Camera Timestamps'],
                    "description": lang["fieldTextWallClockTimestampIgnore"],
                    "default": "0",
                    "example": "",
                    "form-group-class": "h_t_input h_t_h264",
                    "fieldType": "select",
                    "possible": [
                        {
                           "name": lang.No,
                           "value": "0"
                        },
                        {
                           "name": lang.Yes,
                           "value": "1"
                        }
                    ]
                 },
              ]
           },
           "Stream": {
              "name": lang.Stream,
              "color": "navy",
              "id": "monSectionStream",
              "isSection": true,
              "input-mapping": "stream",
              "blockquoteClass": "global_tip",
              "blockquote": lang.StreamText,
              "info": [
                 {
                    "name": "detail=stream_type",
                    "field": lang["Stream Type"],
                    "description": lang["fieldTextStreamType"],
                    "default": "mp4",
                    "example": "",
                    "selector": "h_st",
                    "fieldType": "select",
                    "attribute": `triggerChange="#add_monitor [detail=stream_vcodec]" triggerChangeIgnore="b64,mjpeg,jpeg,gif"`,
                    "possible": [
                         {
                            "name": lang.Poseidon,
                            "value": "mp4",
                            "info": lang["fieldTextStreamTypePoseidon"]
                         },
                         {
                            "name": lang['FLV'],
                            "value": "flv",
                            "info": lang["fieldTextStreamTypeFLV"]
                         },
                         {
                            "name": lang['HLS (includes Audio)'],
                            "value": "hls",
                            "info": lang["fieldTextStreamTypeHLS(includesAudio)"]
                         }
                     ]
                 },
                 {
                     hidden:true,
                     "name": "detail=stream_flv_type",
                     "field": lang["Connection Type"],
                     "description": lang["fieldTextStreamFlvType"],
                     "default": "0",
                     "example": "",
                     "fieldType": "select",
                     "form-group-class": "h_st_input h_st_flv h_st_mp4",
                     "possible": [
                        {
                           "name": lang.HTTP,
                           "value": "http",
                        },
                        {
                           "name": lang.Websocket,
                           "value": "ws",
                        }
                     ]
                 },
                 {
                     hidden:true,
                    "name": "detail=stream_flv_maxLatency",
                    "field": lang["Max Latency"],
                    "description": "",
                    "default": "10",
                    "example": "20000",
                    "form-group-class": "h_st_lat_input h_st_lat_ws",
                    "form-group-class-pre-layer": "h_st_input h_st_mjpeg",
                    "possible": ""
                 },
                 {
                    "name": "detail=stream_acodec",
                    "field": lang["Audio Codec"],
                    "description": lang["fieldTextStreamAcodec"],
                    "default": "0",
                    "example": "",
                    "fieldType": "select",
                    "form-group-class": "h_st_input h_st_hls h_st_flv h_st_mp4",
                    "possible": [
                       {
                          "name": lang.Auto,
                          "info": lang["fieldTextStreamAcodecAuto"],
                          "value": ""
                       },
                       {
                          "name": lang["No Audio"],
                          "info": lang["fieldTextStreamAcodecNoAudio"],
                          "value": "no"
                       },
                       {
                          "name": "libvorbis",
                          "info": lang["fieldTextStreamAcodecLibvorbis"],
                          "value": "libvorbis"
                       },
                       {
                          "name": "libopus",
                          "info": lang["fieldTextStreamAcodecLibopus"],
                          "value": "libopus"
                       },
                       {
                          "name": "libmp3lame",
                          "info": lang["fieldTextStreamAcodecLibmp3lame"],
                          "value": "libmp3lame"
                       },
                       {
                          "name": "aac",
                          "info": lang["fieldTextStreamAcodecAac"],
                          "value": "aac"
                       },
                       {
                          "name": "ac3",
                          "info": lang["fieldTextStreamAcodecAc3"],
                          "value": "ac3"
                       },
                       {
                          "name": "copy",
                          "info": lang["fieldTextStreamAcodecCopy"],
                          "value": "copy"
                       }
                    ]
                 },
                 {
                    "name": "detail=signal_check",
                    "field": lang["Check Signal Interval"],
                    "description": lang["fieldTextSignalCheck"],
                    "default": "0",
                    "example": "",
                    "possible": ""
                 },
                 {
                    "name": "detail=signal_check_log",
                    "field": lang["Log Signal Event"],
                    "description": lang["fieldTextSignalCheckLog"],
                    "default": "0",
                    "example": "",
                    "fieldType": "select",
                    "possible": [
                       {
                          "name": lang.No,
                          "value": "0",
                       },
                       {
                          "name": lang.Yes,
                          "value": "1",
                       }
                    ]
                 },
              ]
           },
           "Recording": {
              "id": "monSectionRecording",
              "name": lang.Recording,
              "color": "red",
              "isSection": true,
              "input-mapping": "record",
              "blockquote": lang.RecordingText,
              "blockquoteClass": 'global_tip',
              "section-class": 'h_m_input h_m_record h_m_idle',
              "info": [
                 {
                    "name": "ext",
                    "field": lang["Record File Type"],
                    "description": lang["fieldTextExt"],
                    "default": "MP4",
                    "example": "",
                    "selector": "h_f",
                    "fieldType": "select",
                    "possible": [
                       {
                          "name": "MP4",
                          "value": "mp4",
                          "info": lang["fieldTextExtMP4"]
                       }
                    ]
                 },
                 {
                    "name": "detail=acodec",
                    "field": lang['Audio Codec'],
                    "description": lang["fieldTextAcodec"],
                    "default": "0",
                    "example": "",
                    "fieldType": "select",
                    "possible": [
                       {
                          "name": lang.Default,
                          "value": "default"
                       },
                       {
                          "name": lang.Auto,
                          "value": "none"
                       },
                       {
                          "name": lang["No Audio"],
                          "value": "no"
                       },
                       {
                          "name": "WebM",
                          "optgroup": [
                             {
                                "name": `libvorbis (${lang.Default})`,
                                "value": "libvorbis"
                             },
                             {
                                "name": "libopus",
                                "value": "libopus"
                             }
                          ]
                       },
                       {
                          "name": "MP4",
                          "optgroup": [
                             {
                                "name": "libmp3lame",
                                "value": "libmp3lame"
                             },
                             {
                                "name": `aac (${lang.Default})`,
                                "value": "aac"
                             },
                             {
                                "name": "ac3",
                                "value": "ac3"
                             },
                             {
                                "name": "copy",
                                "value": "copy"
                             }
                          ]
                       }
                    ]
                 },
                 {
                    "name": "detail=cutoff",
                    "field": lang['Recording Segment Interval'],
                    "description": lang["fieldTextCutoff"],
                    "default": "15",
                    "example": "60",
                    "attribute": `triggerChange="#add_monitor [detail=vcodec]"`,
                    "possible": ""
                 }
              ]
           },
           "Detector": {
              "name": lang['Detector Settings'],
              "headerTitle": `${lang['Detector Settings']} <small>${lang['Primary Engine']} : <b class="h_det_pam_input h_det_pam_1">Pixel Array</b><span class="h_det_pam_input h_det_pam_0"><b class="shinobi-detector_name"></b> <b class="shinobi-detector-invert">${lang['Not Connected']}</b><b class="shinobi-detector" style="display:none">${lang['Connected']}</b></span></small></h4>`,
              "color": "orange",
              "isSection": true,
              "input-mapping":"detector",
              "id": "monSectionDetector",
              "selector": "h_det",
              "attribute": `triggerChange="#add_monitor [detail=detector_record_method]"`,
              "blockquote": `${lang.DetectorText}\n<p class="shinobi-detector-msg"></p>`,
              "info": [
                 {
                    "name": "detail=detector",
                    "field": lang.Enabled,
                    "description": lang["fieldTextDetector"],
                    "default": "0",
                    "example": "",
                    "fieldType": "select",
                    "selector": "h_det",
                    "possible": [
                       {
                          "name": lang.No,
                          "value": "0"
                       },
                       {
                          "name": lang.Yes,
                          "value": "1"
                       }
                    ]
                 },
                 {
                     hidden: true,
                    "name": "detail=detector_save",
                    "field": lang["Save Events"],
                    "description": lang["fieldTextDetectorSave"],
                    "default": "1",
                    "example": "",
                    "form-group-class": "h_det_input h_det_1",
                    "fieldType": "select",
                    "possible": [
                       {
                          "name": lang.No,
                          "value": "0"
                       },
                       {
                          "name": lang.Yes,
                          "value": "1"
                       }
                    ]
                 },
                 {
                    "name": "detail=use_detector_filters",
                    "field": lang['Event Filters'],
                    "description": lang.fieldTextEventFilters,
                    "default": "0",
                    "example": "",
                    "selector": "h_det_fil",
                    "fieldType": "select",
                    "form-group-class-pre-layer": "h_det_input h_det_1",
                    "possible": [
                       {
                          "name": lang.No,
                          "value": "0"
                       },
                       {
                          "name": lang.Yes,
                          "value": "1"
                       }
                    ]
                 },

                 {
                    "name": "detail=detector_buffer_seconds_before",
                    "field": lang['Buffer Time from Event'],
                    "description": lang["fieldTextBufferTimeFromEvent"],
                    "default": "5",
                    "form-group-class": "h_det_input h_det_1",
                    "form-group-class-pre-layer": "h_rec_mtd_input h_rec_mtd_sip",
                 },
                 {
                     hidden: true,
                    "name": "detail=detector_timeout",
                    "field": lang["Recording Timeout"],
                    "description": "The length of time \"Trigger Record\" will run for. This is read in minutes.",
                    "default": "10",
                    "example": "",
                    "form-group-class": "h_det_input h_det_1",
                    "form-group-class-pre-layer": "h_rec_mtd_input h_rec_mtd_hot h_rec_mtd_sip",
                    "possible": ""
                 },
                 {
                     hidden: true,
                    "name": "detail=watchdog_reset",
                    "field": lang["Timeout Reset on Next Event"],
                    "description": lang["fieldTextWatchdogReset"],
                    "default": "1",
                    "fieldType": "select",
                    "form-group-class": "h_det_input h_det_1",
                    "form-group-class-pre-layer": "h_rec_mtd_input h_rec_mtd_hot h_rec_mtd_sip",
                    "possible": [
                       {
                          "name": lang.No,
                          "value": "0"
                       },
                       {
                          "name": lang.Yes,
                          "value": "1"
                       }
                    ]
                 },
                 {
                     hidden: true,
                    "name": "detail=detector_lock_timeout",
                    "field": lang['Allow Next Trigger'],
                    "description": lang["fieldTextDetectorLockTimeout"],
                    "default": "2000",
                    "example": "",
                    "form-group-class": "h_det_input h_det_1",
                    "possible": ""
                 },
                 {
                     hidden: true,
                    "name": lang['Event-Based Recording'],
                    "input-mapping": "detector_sip_buffer",
                    "color": "orange",
                    id: "monSectionAudioOnlyDetectorTraditionalRecording",
                    isSection: true,
                    isFormGroupGroup: true,
                    "section-class": "h_det_input h_det_1",
                    "info": [
                        {
                           "name": "detail=detector_buffer_vcodec",
                           "field": lang['HLS Video Encoder'],
                           "description": "",
                           "default": "0",
                           "example": "",
                           "selector": "h_buff",
                           "fieldType": "select",
                           "possible": [
                               {
                                  "name": "Auto",
                                  "value": "auto"
                               },
                               {
                                  "name": "libx264",
                                  "value": "libx264"
                               },
                               {
                                  "name": "H.264 VA-API (Intel HW Accel)",
                                  "value": "h264_vaapi"
                               },
                               {
                                  "name": "H.265 VA-API (Intel HW Accel)",
                                  "value": "hevc_vaapi"
                               },
                               {
                                  "name": lang.copy,
                                  "value": "copy"
                               }
                            ]
                        },
                        {
                           "name": "detail=detector_buffer_acodec",
                           "field": lang['HLS Audio Encoder'],
                           "description": "",
                           "default": "no",
                           "fieldType": "select",
                           "possible": [
                               {
                                  "name": lang['No Audio'],
                                  "value": "no"
                               },
                               {
                                  "name": "Auto",
                                  "value": "auto"
                               },
                               {
                                  "name": "aac",
                                  "value": "aac"
                               },
                               {
                                  "name": "ac3",
                                  "value": "ac3"
                               },
                               {
                                  "name": "libmp3lame",
                                  "value": "libmp3lame"
                               },
                               {
                                  "name": lang.copy,
                                  "value": "copy"
                               }
                            ]
                        },
                        {
                           "name": "detail=detector_buffer_fps",
                           "field": lang['Frame Rate'],
                           "description": "",
                           "default": "30",
                           "example": "",
                           "form-group-class": "h_buff_input h_buff_libx264 h_buff_h264_vaapi h_buff_hevc_vaapi",
                           "possible": ""
                        },
                        {
                           "name": "detail=event_record_scale_x",
                           "field": lang.Width,
                           "description": lang["fieldTextEventRecordScaleX"],
                           "default": "",
                           "fieldType": "number",
                           "numberMin": "1",
                           "example": "640",
                           "form-group-class": "h_buff_input h_buff_libx264 h_buff_h264_vaapi h_buff_hevc_vaapi",
                           "possible": ""
                        },
                        {
                           "name": "detail=event_record_scale_y",
                           "field": lang.Height,
                           "description": lang["fieldTextEventRecordScaleY"],
                           "default": "",
                           "fieldType": "number",
                           "numberMin": "1",
                           "example": "480",
                           "form-group-class": "h_buff_input h_buff_libx264 h_buff_h264_vaapi h_buff_hevc_vaapi",
                           "possible": ""
                        },
                        {
                            name: 'detail=event_record_aduration',
                            field: lang['Analyzation Duration'],
                            default: '1000',
                        },
                        {
                            name: 'detail=event_record_probesize',
                            field: lang['Probe Size'],
                            default: '32',
                        },
                        {
                           "fieldType": "div",
                           // style: `width:100%;background:#eceaea;border-radius:5px;color:#333;font-family:monospace`,
                           divContent: `<pre><code id="monEditBufferPreview"></code></pre>`
                        },
                    ]
                 },
                 {
                     hidden: true,
                    "name": lang['Audio Detector'],
                    "color": "orange",
                    id: "monSectionAudioOnlyAudioDetector",
                    isSection: true,
                    isFormGroupGroup: true,
                    "section-class": "h_det_input h_det_1",
                    "info": [
                        {
                           "name": "detail=detector_audio",
                           "field": lang.Enabled,
                           "description": lang["fieldTextDetectorAudio"],
                           "default": "0",
                           "example": "",
                           "fieldType": "select",
                           "possible": [
                              {
                                 "name": lang.No,
                                 "value": "0"
                              },
                              {
                                 "name": lang.Yes,
                                 "value": "1"
                              }
                           ]
                       },
                       {
                           "name": "detail=detector_audio_min_db",
                           "field": lang['Minimum dB'],
                           "description": "",
                           "default": "5",
                           "example": "",
                           "possible": ""
                        },
                        {
                           "name": "detail=detector_audio_max_db",
                           "field": lang['Maximum dB'],
                           "description": "",
                           "default": "",
                           "example": "",
                           "possible": ""
                        }
                    ]
                },
              ]
           },
        }
    }
}
