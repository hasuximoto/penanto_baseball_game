Attribute VB_Name = "Module_off"


Sub オフシーズン開始()



'一応計算しておく
Sheets("選手データ").Calculate

'所属team保存
Range("選手データ!HC3:HC1000").Value = Range("選手データ!AJ3:AJ1000").Value

'team成績保存
Sheets("表彰").Calculate
Sheets("年度別チーム成績").Calculate
Range("年度別チーム成績!A" & Range("年度別チーム成績!A1").Value & ":IV" & Range("年度別チーム成績!A1").Value).Value = Range("年度別チーム成績!A3:IV3").Value

'通算成績保存
Range("選手データ!GQ3:GW1000").Calculate
Range("選手データ!GJ3:GP1000").Value = Range("選手データ!GQ3:GW1000").Value

'評価巧打・長打・投手保存
Range("選手データ!W2:W1000").Calculate
Range("選手データ!Y2:Y1000").Calculate
Range("選手データ!AV2:AV1000").Calculate
Range("選手データ!FE2:FE1000").Value = Range("選手データ!W2:W1000").Value
Range("選手データ!FF2:FF1000").Value = Range("選手データ!Y2:Y1000").Value
Range("選手データ!FG2:FG1000").Value = Range("選手データ!AV2:AV1000").Value

'評価守備力保存,個人成績保存より前
Call 守備力評価と成績の保存

'今季の成績保存
Sheets("現役選手成績保管").Calculate
Range("現役選手成績保管!B2:AE1000").Value = Range("現役選手成績保管!AF2:BI1000").Value

Sheets("FA選手").Calculate
Sheets("オフ動向").Calculate  'これ以降の行動にはこのｼｰﾄの更新がかかわるので位置動かさない

'引退者まとめ
Sheets("表彰").Calculate

'ドラフト補強Pにも使う
Sheets("FA選手").Calculate

Sheets("ドラフト候補生産").Calculate
Range("Sheet4!A1:IV1000").Value = Range("ドラフト候補生産!A1:IV1000").Value

Sheets("新外国人生産").Calculate
Range("Sheet7!A1:IV1000").Value = Range("新外国人生産!A1:IV1000").Value

Range("ドラフト会議!A81") = "1"
Call ドラフト会議準備

'球団予算記述
Range("data!I1113").Value = Range("オフ動向!GD58").Value '予算決定
Range("data!I1114").Value = Range("オフ動向!GE58").Value
Range("data!I1115").Value = Range("オフ動向!GF58").Value
Range("data!I1116").Value = Range("オフ動向!GG58").Value
Range("data!I1117").Value = Range("オフ動向!GH58").Value
Range("data!I1118").Value = Range("オフ動向!GI58").Value
Range("オフ動向!GE60:GI60").Value = Range("オフ動向!GE51:GI51").Value '来季へストック

'タイトル書込
Range("オフ動向!FO3:FO1000").Calculate
Range("選手データ!HF3:HF1000").Value = Range("オフ動向!FO3:FO1000").Value

'ストーブリーグ開始
Range("data!Q1091:Q1096").Value = ""
Range("data!CZ1121:CZ1270").Value = ""
Range("data!CO1121:CO1270").Value = ""
Range("data!W1121:AB1270").Value = "0"
Range("data!BV1121:BV1270").Value = ""
Range("data!G1121:I1270").Value = ""
Range("data!C1106").Value = 21
Sheets("FA選手").Calculate
Range("data!A1106:HZ1422").Calculate

Range("data!C61") = 2

End Sub
Sub オフシーズン終了()

'オフの選手動向保存,年数用いるのでキャンプ前に
Sheets("選手リスト").Calculate
Range("オフ動向!FL3:FN1000").Calculate
Range("選手データ!HD3:HD1000").Value = Range("オフ動向!FN3:FN1000").Value

'同様にタイトル保存


Range("オフ動向!FG3:FJ1000").Calculate
'年俸 FA日数 契約年数 新人王資格　書き換え
Range("選手データ!EY3:EY1000").Value = Range("オフ動向!FG3:FG1000").Value
Range("選手データ!EZ3:EZ1000").Value = Range("オフ動向!FI3:FI1000").Value
Range("選手データ!FH3:FH1000").Value = Range("オフ動向!FH3:FH1000").Value
Range("選手データ!EW3:EW1000").Value = Range("オフ動向!FJ3:FJ1000").Value

Call キャンプ実行 '年数+する前（新入団=0年目）に実行　成績見るため

Range("選手データ!B3:S1000").Value = Range("キャンプ計算!B3:S1000").Value
Range("選手データ!U3:U1000").Value = Range("キャンプ計算!T3:T1000").Value
Range("選手データ!Z3:Z1000").Value = Range("キャンプ計算!U3:U1000").Value
Range("選手データ!CT3:CT1000").Value = Range("キャンプ計算!HZ3:HZ1000").Value
Range("選手データ!CL3:CO1000").Value = Range("キャンプ計算!IE3:IH1000").Value
Range("選手データ!BU3:BU1000").Value = Range("キャンプ計算!II3:II1000").Value
Range("選手データ!BZ3:CE1000").Value = Range("キャンプ計算!IJ3:IO1000").Value
Range("選手データ!FR3:FW1000").Value = Range("キャンプ計算!AN3:AS1000").Value
Range("選手データ!FX3:FZ1000").Value = Range("キャンプ計算!BI3:BK1000").Value
Range("選手データ!BY3:BY1000").Value = Range("キャンプ計算!BL3:BL1000").Value

Range("選手データ!H3:M1000").Replace what:="'", replacement:=""
Dim i As Integer
For i = 3 To 1000
    If Not Range("選手データ!GA" & i) = "" Then
        Range("選手データ!GA" & i) = "'" & right(Range("選手データ!GA" & i), 27)
    End If
Next

Call 年度切り替え
Range("data!C61") = 1

End Sub



Sub ストーブリーグ_ターン進行()

stove_league.sinkou.left = 700
stove_league.sinkou_message.Caption = "ターン進行中"
stove_league.Repaint

Dim i As Integer
Dim トレード記録row As Integer

Range("data!C1106") = Range("data!C1106") - 1

'タイトル発表
If Range("data!C1106") = 20 Then
    Range("data!CR1121:CW1181").Calculate
    With stove_league
        .hyosho.left = 10
        .gg_shou.ColumnCount = 3
        .gg_shou.ColumnWidths = "40;80;100"
        .gg_shou.RowSource = "表彰!D2:F10"
        .gg_shou.ColumnHeads = True
        .best_9.ColumnCount = 3
        .best_9.ColumnWidths = "40;80;100"
        .best_9.RowSource = "表彰!A2:C11"
        .best_9.ColumnHeads = True
        .mvp.ColumnCount = 2
        .mvp.ColumnWidths = "80;100"
        .mvp.RowSource = "表彰!G2:H2"
        .mvp.ColumnHeads = True
        .sinzinou.ColumnCount = 2
        .sinzinou.ColumnWidths = "80;100"
        .sinzinou.RowSource = "表彰!I2:J2"
        .sinzinou.ColumnHeads = True
        .sawamurashou.ColumnCount = 2
        .sawamurashou.ColumnWidths = "80;100"
        .sawamurashou.RowSource = "表彰!K2:L2"
        .sawamurashou.ColumnHeads = True
        .title.ColumnCount = 3
        .title.ColumnWidths = "80;80;45"
        .title.RowSource = "表彰!AO24:AQ" & Range("表彰!AH21").Value
        .title.ColumnHeads = True
    End With
End If
'引退選手発表
If Range("data!C1106") = 19 Then
    Range("data!CR1121:CW1181").Calculate
    With stove_league
        .hyosho.left = 1000
        .intai.left = 10
        .intailist.ColumnCount = 4
        .intailist.ColumnWidths = "80;50;120;150"
        .intailist.RowSource = "表彰!B14:E" & Range("表彰!F13")
        .intailist.ColumnHeads = True
    End With
End If
'ドラフト会議
If Range("data!C1106") = 18 Then
    Range("data!CR1121:CW1181").Calculate
    With stove_league
        .go_to_draft.left = 305
        .intai.left = 1000
        .drft_joho.left = 10
        .dr1.Caption = Range("sheet4!EL13").Value
        .dr2.Caption = Range("sheet4!EL14").Value
        .dr3.Caption = Range("sheet4!EL15").Value
        .dr4.Caption = Range("sheet4!EL16").Value
        .dr5.Caption = Range("sheet4!EL17").Value
        .dr1_2.Caption = Range("sheet4!EN13").Value
        .dr2_2.Caption = Range("sheet4!EN14").Value
        .dr3_2.Caption = Range("sheet4!EN15").Value
        .dr4_2.Caption = Range("sheet4!EN16").Value
        .dr5_2.Caption = Range("sheet4!EN17").Value
        .dr1_3.Caption = Range("sheet4!EM13").Value
        .dr2_3.Caption = Range("sheet4!EM14").Value
        .dr3_3.Caption = Range("sheet4!EM15").Value
        .dr4_3.Caption = Range("sheet4!EM16").Value
        .dr5_3.Caption = Range("sheet4!EM17").Value
    End With
End If
'戦力外＆残留交渉
If Range("data!C1106") = 17 Then
    Range("オフ動向!FQ3:FR1000").Calculate
    Range("オフ動向!GC61:GE65").Calculate
    Range("data!CR1121:CW1181").Calculate
    With stove_league
        .drft_joho.left = 1000
        .go_to_senryokugai.left = 305
    End With
End If
'FA公示
If Range("data!C1106") = 16 Then
    Range("オフ動向!FS3:FT1000").Calculate
    Range("オフ動向!GG61:GI75").Calculate
    Range("data!CR1121:CW1181").Calculate
    With stove_league
        .falist.left = 10
        .koushou.left = 1000
    End With
End If
'FA等争奪戦
If Range("data!C1106") < 16 Then
    With stove_league
        .trade_koushou.left = 504
        .koushou.left = 234
        .falist.left = 10
        .fa_setumei.left = 1000
    End With
    Sheets("選手リスト").Calculate
    Sheets("FA選手").Calculate
    'トレード
    If Range("FA選手!DL151") = True Then
        '移籍作業
        Range("選手リスト!B1:G100").Replace what:=Range("FA選手!DJ154"), replacement:="", LookAt:=xlWhole, SearchOrder:=xlByRows, MatchCase:=False, SearchFormat:=False, ReplaceFormat:=False
        Range("選手リスト!B1:G100").Replace what:=Range("FA選手!DK154"), replacement:="", LookAt:=xlWhole, SearchOrder:=xlByRows, MatchCase:=False, SearchFormat:=False, ReplaceFormat:=False
        Range("選手リスト!B1:G100").Replace what:=Range("FA選手!DL154"), replacement:="", LookAt:=xlWhole, SearchOrder:=xlByRows, MatchCase:=False, SearchFormat:=False, ReplaceFormat:=False
        Range("選手リスト!B1:G100").Replace what:=Range("FA選手!DM154"), replacement:="", LookAt:=xlWhole, SearchOrder:=xlByRows, MatchCase:=False, SearchFormat:=False, ReplaceFormat:=False
        Range(Range("FA選手!DJ153").Value).Value = Range("FA選手!DJ154").Value
        Range(Range("FA選手!DK153").Value).Value = Range("FA選手!DK154").Value
        Range(Range("FA選手!DL153").Value).Value = Range("FA選手!DL154").Value
        Range(Range("FA選手!DM153").Value).Value = Range("FA選手!DM154").Value
        Range(Range("FA選手!DN153").Value).Value = Range("FA選手!DN154").Value
        Range(Range("FA選手!DO153").Value).Value = Range("FA選手!DO154").Value
        '記録作業
        トレード記録row = 158
        Do While Not Range("FA選手!DJ" & トレード記録row) = ""
            トレード記録row = トレード記録row + 1
        Loop
        Range("FA選手!DJ" & トレード記録row & ":DK" & トレード記録row + 3).Value = Range("FA選手!DM158:DN161").Value
    ElseIf Range("FA選手!DN151") = True Then
        trade_neko.Show
    End If
    Range("data!A1112:HZ1422").Calculate
    '契約選手入団
    Range("data!G1121:I1270").Value = Range("data!BH1121:BJ1270").Value
    'メッセージ
    For i = 1121 To 1270
        If Not Range("data!BU" & i).Value = 0 Then
            Range("data!K1103").Value = i
            keiyaku_message.Show
        End If
    Next
    Range("data!W1121:AB1270").Value = Range("data!AI1121:AN1270").Value
    'メッセージ削除
    Range("data!BV1121:BV1270").Value = ""
    'ニュース重複防止
    Range("data!CO1121:CO1270").Value = Range("data!CP1121:CP1270").Value
    For i = 1121 To 1270
        '補償が要る場合=人的補償のために入団作業の前
        If Not Range("data!CY" & i).Value = "-" Then
            Range("FA選手!DL43").Value = Range("data!C" & i).Value
            Range("FA選手!DJ42:DX144").Calculate
            '自球団が補償払う場合
            If Range("FA選手!DQ85") = True Then
                Range("FA選手!DT44:DT113") = ""
                Range("FA選手!DT44:DT" & Range("FA選手!DX42").Value - 28) = "プロテクトしない"
                Range("FA選手!DT" & Range("FA選手!DX42").Value - 28 + 1 & ":DT" & Range("FA選手!DX42").Value) = "プロテクト"
                fa_hosho_settei.Show
            '自球団が補償貰う場合
            ElseIf Range("FA選手!DP85") = True Then
                fa_hosho.Show
            End If
            '獲る選手計算＆移籍させる
            Range("FA選手!EA1:EM100").Calculate
            Range("FA選手!DJ43:DX144").Calculate
            Range(Range("FA選手!DP89").Value).Value = Range("FA選手!DP90").Value
            Range(Range("FA選手!DQ89").Value).Value = Range("FA選手!DQ90").Value
            Range(Range("FA選手!DR89").Value).Value = Range("FA選手!DR90").Value
            Range(Range("FA選手!DS89").Value).Value = Range("FA選手!DS90").Value
            'メッセージ
            If Not Range("FA選手!DR94").Value = "" Then
                MsgBox Range("FA選手!DR94").Value
                MsgBox Range("FA選手!DS94").Value
            End If
            '補償メモ
            Range("data!CZ" & i).Value = Range("FA選手!DQ94").Value
            '選択リセット
            Range("FA選手!DR96:DS96").Value = ""
        End If
        '入団作業
        If Not Range("data!BK" & i).Value = 0 Then
            Range(Range("data!BK" & i).Value).Value = Range("data!C" & i).Value
        End If
    Next
    Range("data!W1121:AB1270").Value = Range("data!AI1121:AN1270").Value
End If
'キャンプへ
If Range("data!C1106") = 0 Then
    With stove_league
        .koushou.left = 1000
        .go_to_camp.left = 305
    End With
End If

stove_league.sinkou_message.Caption = ""
stove_league.sinkou.left = 320

stove_news.Show

End Sub
Sub ドラフト会議準備()

Range("ドラフト会議!ES4:EX13") = ""
Range("ドラフト会議!FA8:FA14") = ""
Range("ドラフト会議!FA7") = "1"
Range("ドラフト会議!FA27") = ""
Range("ドラフト会議!FA29:FA30") = ""
Sheets("ドラフト会議").Calculate

End Sub
Sub 守備力評価と成績の保存()

Dim pn As Integer
For i = 3 To 1000
    If Not Range("選手データ!AJ" & i).Value = "" Then
        If Len(Range("選手データ!Z" & i).Value) = 1 Then
            Range("data!C301") = Range("選手データ!A" & i).Value
            Range("data!M321:BE395").Calculate
            Range("選手データ!GA" & i).Value = "'" & Range("data!U341").Value
            Range("現役選手成績保管!EA" & i - 1).Value = Range("data!M341").Value
        Else
            Range("data!C301") = Range("選手データ!A" & i).Value
            Range("data!AM418:BE423").Calculate
            Range("現役選手成績保管!EA" & i - 1).Value = Range("data!AN423").Value
        End If
    End If
Next

End Sub

Sub キャンプ実行()

Sheets("キャンプ計算").Calculate
Range("キャンプ計算!C3:U1000").Value = Range("キャンプ計算!FC3:FU1000").Value

End Sub

Sub 解雇開始()

Range("data!M1002:M1081").Value = ""
Range("data!A1000:iv1120").Calculate
senryokugai.Show

End Sub

Sub 解雇実行()

MsgBox "選手を解雇しました"

Call 残留交渉開始

End Sub

Sub 残留交渉開始()

Range("data!A1000:iv1120").Calculate
Range("data!X1002:Y1081").Value = Range("data!V1002:W1081").Value
Range("data!A1000:iv1120").Calculate
zanryu_koushou.Show

End Sub
Sub 残留交渉結果()

Range("オフ動向!FC3:FD1000").Calculate
Range("オフ動向!FE3:FF1000").Value = Range("オフ動向!FC3:FD1000").Value
Range("オフ動向!FK3:FK1000").Value = Range("オフ動向!AD3:AD1000").Value
Call 退団選手と引退選手の処理
Range("data!M1002:M1081").Value = ""
Call 外国人選手登録
Range("オフ動向!GC61:GI75").Calculate

End Sub


Sub 退団選手と引退選手の処理()

Sheets("選手リスト").Calculate
Sheets("選手データ").Calculate
Range("Sheet6!BR3:BS1000").Calculate

Dim i As Long
Dim 保管庫番号 As Long

保管庫番号 = 3

'作業２ 前年の退団選手を選手データから除く
Range("Sheet6!BR1") = 2
Range("Sheet6!BR1:BS1000").Calculate
For i = 3 To 1000
    If Not Range("Sheet6!BR" & i) = "" Then
        '＜どこかに在籍したことある選手＝1年目でない＞なら成績保管
        If Not Range("選手データ!EX" & i).Value = "1" Then
            Do Until Range("引退選手成績保管!A" & 保管庫番号 - 1).Value = ""
                If Range("引退選手成績保管!A" & 保管庫番号).Value = "" Then
                    Range("引退選手成績保管!A" & 保管庫番号).Value = Range("選手データ!A" & i).Value
                    Range("引退選手成績保管!B" & 保管庫番号 & ":AE" & 保管庫番号).Value = Range("現役選手成績保管!AF" & i - 1 & ":BI" & i - 1).Value
                    Range("引退選手成績保管!AF" & 保管庫番号 & ":AL" & 保管庫番号).Value = Range("選手データ!GJ" & i & ":GP" & i).Value
                    Range("引退選手成績保管!AM" & 保管庫番号 & ":AM" & 保管庫番号).Value = Range("選手データ!HB" & i & ":HB" & i).Value
                    Range("引退選手成績保管!AN" & 保管庫番号 & ":AN" & 保管庫番号).Value = Range("選手データ!HD" & i & ":HD" & i).Value
                    Range("引退選手成績保管!AO" & 保管庫番号 & ":AO" & 保管庫番号).Value = Range("data!C3").Value
                    Range("引退選手成績保管!AP" & 保管庫番号 & ":AP" & 保管庫番号).Value = Range("選手データ!HE" & i & ":HE" & i).Value
                    Range("引退選手成績保管!AQ" & 保管庫番号 & ":AQ" & 保管庫番号).Value = Range("選手データ!EX" & i & ":EX" & i).Value
                    Range("引退選手成績保管!AR" & 保管庫番号 & ":AR" & 保管庫番号).Value = Range("選手データ!EG" & i & ":EG" & i).Value
                    Range("引退選手成績保管!AS" & 保管庫番号 & ":AS" & 保管庫番号).Value = Range("選手データ!HF" & i & ":HF" & i).Value
                    'リスト用
                    Range("引退選手成績保管!BA" & 保管庫番号).Value = Range("選手データ!A" & i).Value
                    Range("引退選手成績保管!BB" & 保管庫番号 & ":BB" & 保管庫番号).Value = Range("選手データ!HE" & i & ":HE" & i).Value
                    Range("引退選手成績保管!BC" & 保管庫番号) = Range("引退選手成績保管!AO" & 保管庫番号) - Range("引退選手成績保管!AQ" & 保管庫番号) + 1 & " - " & Range("引退選手成績保管!AO" & 保管庫番号) - 1 & " (" & Range("引退選手成績保管!AQ" & 保管庫番号) - 1 & "年)"
                    保管庫番号 = 保管庫番号 + 1
                End If
                保管庫番号 = 保管庫番号 + 1
            Loop
            保管庫番号 = 保管庫番号 - 1
        End If
        '選手削除
        Range("選手データ!A" & i) = ""
    End If
Next

'作業１ その年の退団選手を選手リストから除く
Range("Sheet6!BR1") = 1
Range("Sheet6!BR1:BS1000").Calculate
For i = 3 To 1000
    If Range("Sheet6!BR" & i) = "" Then
    Else
        '選手削除
        Range(Range("Sheet6!BS" & i).Value).Replace what:=Range("Sheet6!BR" & i), replacement:="", LookAt:=xlWhole
    End If
Next

End Sub

Sub 外国人選手登録()

Sheets("新外国人生産").Calculate
Range("Sheet7!A1:IV1000").Value = Range("新外国人生産!A1:IV1000").Value

Sheets("Sheet6").Calculate

Dim C2 As Long
Dim 助っ人番号 As Long

助っ人番号 = 65

For C2 = 3 To 1000
    If 助っ人番号 > 155 Then
    Else
        If Not Range("Sheet6!M" & 助っ人番号) = "0" Then
            If Range("選手データ!A" & C2) = "" Then
                Range("選手データ!A" & C2 & ":U" & C2).Value = Range("Sheet6!M" & 助っ人番号 & ":AG" & 助っ人番号).Value
                Range("選手データ!Z" & C2).Value = Range("Sheet6!AH" & 助っ人番号).Value
                Range("選手データ!EG" & C2 & ":EV" & C2).Value = Range("Sheet6!AI" & 助っ人番号 & ":AX" & 助っ人番号).Value
                Range("選手データ!EX" & C2 & ":EZ" & C2).Value = Range("Sheet6!AY" & 助っ人番号 & ":BA" & 助っ人番号).Value
                Range("選手データ!FC" & C2 & ":FF" & C2).Value = Range("Sheet6!BB" & 助っ人番号 & ":BE" & 助っ人番号).Value
                Range("選手データ!FH" & C2).Value = "【1/1】"
                Range("選手データ!EW" & C2).Value = 0
                Range("選手データ!FG" & C2).Value = ""
                Range("選手データ!CL" & C2 & ":CO" & C2).Value = Range("Sheet6!BF" & 助っ人番号 & ":BI" & 助っ人番号).Value
                Range("選手データ!BU" & C2).Value = Range("Sheet6!BJ" & 助っ人番号).Value
                Range("選手データ!FX" & C2 & ":GA" & C2).Value = Range("Sheet6!BK" & 助っ人番号 & ":BN" & 助っ人番号).Value
                Range("選手データ!GA" & C2).Value = "'" & Range("Sheet6!BN" & 助っ人番号).Value
                Range("選手データ!BY" & C2).Value = Range("Sheet6!BO" & 助っ人番号).Value
                Range("選手データ!HB" & C2).Value = Range("Sheet6!BP" & 助っ人番号).Value
                Range("選手データ!BZ" & C2).Value = ""
                Range("選手データ!CA" & C2 & ":CE" & C2).Value = "100"
                Range("選手データ!BS" & C2).Value = "1"
                助っ人番号 = 助っ人番号 + 1
            End If
        Else
            Do Until Not Range("Sheet6!M" & 助っ人番号) = "0"
            助っ人番号 = 助っ人番号 + 1
            Loop
        End If
    End If
Next

'引退選手確定させておく
Range("表彰!H14:H114").Value = ""
Range("表彰!H14:H114").Value = Range("表彰!B14:B114").Value

'FA選手まとめ
Sheets("選手リスト").Calculate

'球種データなど更新
Sheets("選手データ").Calculate

Sheets("FA選手").Calculate
Range("data!C1121:C1270").Value = Range("FA選手!B1:B150").Value

Range("data!A1106:HZ1422").Calculate

End Sub

Sub ドラフト指名選手入団()

Range("Sheet6!A1:BQ101").Calculate

Dim c As Long
Dim r As Long

For c = 1 To 6
    For r = 3 To 12
    If Sheets("Sheet6").Cells(r, c) = 0 Then
    Else
        Range(Sheets("Sheet6").Cells(r + 10, c)) = Sheets("Sheet6").Cells(r, c)
    End If
    Next
Next

Dim C2 As Long
Dim 指名選手番号 As Long

指名選手番号 = 3

For C2 = 3 To 1000
    If 指名選手番号 > 62 Then
    Else
        If Not Range("Sheet6!M" & 指名選手番号) = "0" Then
            If Range("選手データ!A" & C2) = "" Then
                Range("選手データ!A" & C2 & ":U" & C2).Value = Range("Sheet6!M" & 指名選手番号 & ":AG" & 指名選手番号).Value
                Range("選手データ!Z" & C2).Value = Range("Sheet6!AH" & 指名選手番号).Value
                Range("選手データ!EG" & C2 & ":EV" & C2).Value = Range("Sheet6!AI" & 指名選手番号 & ":AX" & 指名選手番号).Value
                Range("選手データ!EX" & C2 & ":EZ" & C2).Value = Range("Sheet6!AY" & 指名選手番号 & ":BA" & 指名選手番号).Value
                Range("選手データ!FC" & C2 & ":FF" & C2).Value = Range("Sheet6!BB" & 指名選手番号 & ":BE" & 指名選手番号).Value
                Range("選手データ!FH" & C2).Value = "【1/1】"
                Range("選手データ!EW" & C2).Value = 1
                Range("選手データ!FG" & C2).Value = ""
                Range("選手データ!CL" & C2 & ":CO" & C2).Value = Range("Sheet6!BF" & 指名選手番号 & ":BI" & 指名選手番号).Value
                Range("選手データ!BU" & C2).Value = Range("Sheet6!BJ" & 指名選手番号).Value
                Range("選手データ!FX" & C2 & ":FZ" & C2).Value = Range("Sheet6!BK" & 指名選手番号 & ":BM" & 指名選手番号).Value
                Range("選手データ!GA" & C2).Value = "'" & Range("Sheet6!BN" & 指名選手番号).Value
                Range("選手データ!BY" & C2).Value = Range("Sheet6!BO" & 指名選手番号).Value
                Range("選手データ!HB" & C2).Value = Range("Sheet6!BP" & 指名選手番号).Value
                Range("選手データ!BZ" & C2).Value = ""
                Range("選手データ!CA" & C2 & ":CE" & C2).Value = "100"
                Range("選手データ!BS" & C2).Value = "1"
                指名選手番号 = 指名選手番号 + 1
            End If
        Else
            Do Until Not Range("Sheet6!M" & 指名選手番号) = "0"
            指名選手番号 = 指名選手番号 + 1
            Loop
        End If
    End If
Next
End Sub

Sub 年度切り替え()

Dim i As Long




'■年齢，年数の+
Range("選手データ!GX3:GX1000").Calculate
Range("選手データ!GY3:GY1000").Calculate
Range("選手データ!EG3:EG1000").Value = Range("選手データ!GX3:GX1000").Value
Range("選手データ!EX3:EX1000").Value = Range("選手データ!GY3:GY1000").Value

'■年度+
Range("data!C3") = Range("data!C3") + 1

'■成績リセット
Range("data!C2").Value = "2012/04/01"
Range("data!C5").Value = "午前"
Range("data!D6:D8").Value = ""
Range("data!L20:L25").Value = ""
Range("data!F33").Value = False
Range("試合結果!A1:AZ30000").Value = ""
Range("選手データ!BC3:BR1000").Value = ""
Range("選手データ!AS3:AS1000").Calculate
Range("選手データ!Ao3:Ao1000").Value = Range("選手データ!AS3:AS1000").Value
Range("オーダー!Bj2:Bk29").Value = ""
Range("オーダー!Bm18").Value = ""
Range("選手データ!BT3:BT1000").Value = "'000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005000050000000"
Range("選手データ!CQ3:CQ1000").Value = "'000000000000000"
Range("Sheet1!AD104:AK106").Value = ""

'■トレード履歴削除
Range("FA選手!DJ158:DK357").Value = ""

'■二軍成績リセット
'Range("二軍戦!AB2:AF50") = ""
'Range("二軍戦!AB52:AF100") = ""
'Range("二軍戦!U23:X23") = ""

'■月間MVP
Range("月間MVP選考!R3:AF1001") = ""
Range("月間MVP選考!AR7:BT20") = ""


'■日程
Range("日程!AF3:AQ211").Value = Range("日程!B3:M211").Value

'■疲労
Range("選手データ!BS3:BS1000").Value = ""

'■怪我
Range("選手データ!AK3:AK1000").Value = ""

'■一軍入れ替え履歴削除
Range("一軍計算!I2:J51").Value = 0
Range("一軍計算!F114:G163").Value = 0

Range("一軍計算!V2:W51").Value = 0
Range("一軍計算!S114:T163").Value = 0

Range("一軍計算!AI2:AJ51").Value = 0
Range("一軍計算!AF114:AG163").Value = 0

Range("一軍計算!AV2:AW51").Value = 0
Range("一軍計算!AS114:AT163").Value = 0

Range("一軍計算!BI2:BJ51").Value = 0
Range("一軍計算!BF114:BG163").Value = 0

Range("一軍計算!BV2:BW51").Value = 0
Range("一軍計算!BS114:BT163").Value = 0
        
Calculate

Range("選手データ!AL3:AL1000").Calculate
Range("選手データ!AK3:AK1000").Value = Range("選手データ!AL3:AL1000").Value



End Sub
