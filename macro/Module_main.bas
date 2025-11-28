Attribute VB_Name = "Module_main"
Declare Sub Sleep Lib "kernel32" (ByVal dwMilliseconds As Long)






Sub 進行()

    If Range("data!C5") = "午前" Then
    MsgBox "試合は午後に行えます"
    Else
        If Range("data!C6") = 1 Then
            If Range("data!C36") = "" And Range("data!C37") = "" And Range("data!C38") = "" Then
                MsgBox "今日は試合がありません"
            Else
                If Range("data!E33") = True Then
                Range("オーダー!BJ2:BK29") = ""
                Range("オーダー!BM18") = ""
                Call 試合時更新
                Call harituke
                Else
                Call オーダー決定準備
                End If
           
            End If
                
            Else
            MsgBox "今日はもう試合を行いました"
        End If
    End If



End Sub

Sub メイン情報更新()

Range("data!A1:BA41").Calculate

End Sub

Sub 試合後更新()

Range("data!A42:BA44").Calculate

End Sub


Sub harituke()

'ポジション別平均守備力・失策更新
Range("Sheet1!AD104:AK106").Value = Range("Sheet1!AD108:AK110").Value

'成績更新
Range("Sheet1!AM3:AP100").Calculate

Range(Worksheets("Sheet1").Range("C1").Value).Value = Worksheets("Sheet1").Range("B2:AQ100").Value
Range("data!C6") = 2

'進行バー更新
main_menu.sinko_bar1.Width = 98
main_menu.Repaint

If Range("data!J33") = True Then
MsgBox "試合結果が出ました"
End If

'観戦
If Range("data!I33") = True Then

Range("観戦!EK81") = 1
Sheets("観戦").Calculate
Sheets("観戦").Select
End If

'試合前の順位
Range("data!L20:L25").Value = Range("data!C20:C25").Value
'メインシートだけ再計算
Call メイン情報更新


End Sub




Sub 日程進行()

Range("選手データ!CF1:CK1000").Calculate
Range("選手データ!AL3:AL1000").Calculate
Range("選手データ!GC3:GI1000").Calculate 'news
'エラーにならないか確認
If Range("選手データ!CF1") = 16 Then
MsgBox "怪我エラー"

Else

If Range("data!C5") = "午前" Then
    Range("data!C5") = "午後"
    
    '開幕前は軍入れ替えなし
    If Range("data!C2") < 41005 Then
    Else
        Call 一軍計算
    End If

    'けが
    If Range("data!C33") = True Then
    Else
        Range("選手データ!CF1:CK1000").Calculate
        Range("選手データ!AL3:AL1000").Calculate
        Range("選手データ!GC3:GI1000").Calculate 'news

        Range("選手データ!BZ3:CE1000").Value = Range("選手データ!CF3:CS1000").Value
        Range("選手データ!AK3:AK1000").Value = Range("選手データ!AL3:AL1000").Value
    End If
    
    'かならずケガ→疲労の順で処理する　試合でケガしたとき疲労のところに書かれるから
    
    '発揮度と調子と疲労と怪我履歴
    Range("選手データ!CU3:CU1000").Calculate
    Range("選手データ!CT3:CT1000").Value = Range("選手データ!CU3:CU1000").Value
    Range("選手データ!AP3:AP1000").Calculate
    Range("選手データ!AO3:AO1000").Value = Range("選手データ!AP3:AP1000").Value
    Range("選手データ!GZ3:HA1000").Calculate
    Range("選手データ!BS3:BS1000").Value = Range("選手データ!HA3:HA1000").Value
    Range("選手データ!CR3:CR1000").Calculate
    Range("選手データ!CQ3:CQ1000").Value = Range("選手データ!CR3:CR1000").Value
    
    '月間mvp
    If Range("data!C11") = 1 And Range("data!C9") > 4 Then
    Sheets("月間MVP選考").Calculate
    Range("月間MVP選考!R3:AF1001").Value = Range("選手データ!BC3:BQ1001").Value
    Range("月間MVP選考!AR" & Range("月間MVP選考!A1") * 2 - 1 & ":BW" & Range("月間MVP選考!A1") * 2).Value = Range("月間MVP選考!AR5:BW6").Value
    End If


Else

             '他球団トレード
            If Range("data!C9") < 8 Then
            Range("data!C35").Value = Rnd() * 30
            If Range("data!C35").Value > 29 Then
                Call 他球団トレード
            End If
            End If
            
    '試合行わずに翌日には進めない
    If Range("data!C6") = 1 Then
        '試合がないことの多い月曜の対処
        If Range("data!C4") = 2 Then
            If Range("data!C37") = "" And Range("data!C38") = "" Then '他球場の試合があるかどうか
            Range("data!C2") = Range("data!C2") + 1
            Range("data!C5") = "午前"
            Range("data!C6") = 1
            
            '対戦カード更新
            Range("日程!A1:M2").Calculate
            Range("日程!AR3:AW4").Calculate
            
             
            
            Range("Sheet1!D1").Calculate
            Range(Worksheets("Sheet1").Range("D1").Value).Value = "●"
   
           

            Else
                MsgBox "試合をしてください"
            End If
 
        Else
            'げつよう以外で試合無い日の対処
            If Range("data!C12") = 0 Then
            Range("data!C2") = Range("data!C2") + 1
            Range("data!C5") = "午前"
            Range("data!C6") = 1
            
            '対戦カード更新
            Range("日程!A1:M2").Calculate
            Range("日程!AR3:AW4").Calculate
            
             
             
            Range("Sheet1!D1").Calculate
            Range(Worksheets("Sheet1").Range("D1").Value).Value = "●"
            




            Else
            MsgBox "試合をしてください"
            End If
            
        End If
    Else
            Range("data!C2") = Range("data!C2") + 1
            Range("data!C5") = "午前"
            Range("data!C6") = 1

            '対戦カード更新
            Range("日程!A1:M2").Calculate
            Range("日程!AR3:AW4").Calculate
            
            

    End If
End If

'メインシートだけ再計算
Call メイン情報更新

End If

End Sub

Sub 一軍計算()

Sheets("一軍計算").Calculate

If Range("一軍計算!DU4") = True Then
MsgBox "一軍計算エラーのおそれ"

Else

Range("一軍計算!I2:J51").Value = Range("一軍計算!L2:M51").Value
Range("一軍計算!F114:G163").Value = Range("一軍計算!H114:I163").Value

Range("一軍計算!V2:W51").Value = Range("一軍計算!Y2:Z51").Value
Range("一軍計算!S114:T163").Value = Range("一軍計算!U114:V163").Value

Range("一軍計算!AI2:AJ51").Value = Range("一軍計算!AL2:AM51").Value
Range("一軍計算!AF114:AG163").Value = Range("一軍計算!AH114:AI163").Value

Range("一軍計算!AV2:AW51").Value = Range("一軍計算!AY2:AZ51").Value
Range("一軍計算!AS114:AT163").Value = Range("一軍計算!AU114:AV163").Value

Range("一軍計算!BI2:BJ51").Value = Range("一軍計算!BL2:BM51").Value
Range("一軍計算!BF114:BG163").Value = Range("一軍計算!BH114:BI163").Value

Range("一軍計算!BV2:BW51").Value = Range("一軍計算!BY2:BZ51").Value
Range("一軍計算!BS114:BT163").Value = Range("一軍計算!BU114:BV163").Value

Range("data!C46:P46").Calculate

End If

End Sub

Sub 試合時更新()

'怪我込守備力更新
Range("選手データ!FL1:FQ1000").Calculate

'オーダー決める
'Call 一軍計算

Sheets("オーダー").Calculate
'Call 試合時待機画面


Sleep 1

If Range("日程!E1") = 1 Then
Sheets("試合a").Calculate
End If

'進行バー更新
main_menu.sinko_bar1.Width = 25
main_menu.Repaint

Sleep 1

If Range("日程!I1") = 1 Then
Sheets("試合b").Calculate
End If

'進行バー更新
main_menu.sinko_bar1.Width = 50
main_menu.Repaint

Sleep 1

If Range("日程!M1") = 1 Then
Sheets("試合c").Calculate
End If

'進行バー更新
main_menu.sinko_bar1.Width = 75
main_menu.Repaint

Sleep 1

Sheets("Sheet1").Calculate

'進行バー更新
main_menu.sinko_bar1.Width = 78
main_menu.Repaint

Sleep 1

Call 試合成績記録

Range("選手データ!A1:EF1000").Calculate

'進行バー更新
main_menu.sinko_bar1.Width = 90
main_menu.Repaint

'二軍の試合
'If Range("data!C10") = 1 Then
    'Call 二軍戦
'End If

Sleep 10

'進行バー更新
main_menu.sinko_bar1.Width = 92
main_menu.Repaint

End Sub

Sub 試合時待機画面()

UserForm36.Label1.Caption = Range("オーダー!CA47").Value
UserForm36.Label2.Caption = Range("オーダー!CA48").Value
UserForm36.Label3.Caption = Range("オーダー!CA49").Value
UserForm36.Label4.Caption = Range("オーダー!CA50").Value
UserForm36.Label5.Caption = Range("オーダー!CA51").Value
UserForm36.Label6.Caption = Range("オーダー!CA52").Value
UserForm36.Label7.Caption = Range("オーダー!CA53").Value
UserForm36.Label8.Caption = Range("オーダー!CA54").Value
UserForm36.Label9.Caption = Range("オーダー!CA55").Value
UserForm36.Label10.Caption = Range("オーダー!CA56").Value

UserForm36.Label11.Caption = Range("オーダー!CB47").Value
UserForm36.Label12.Caption = Range("オーダー!CB48").Value
UserForm36.Label13.Caption = Range("オーダー!CB49").Value
UserForm36.Label14.Caption = Range("オーダー!CB50").Value
UserForm36.Label15.Caption = Range("オーダー!CB51").Value
UserForm36.Label16.Caption = Range("オーダー!CB52").Value
UserForm36.Label17.Caption = Range("オーダー!CB53").Value
UserForm36.Label18.Caption = Range("オーダー!CB54").Value
UserForm36.Label19.Caption = Range("オーダー!CB55").Value
UserForm36.Label20.Caption = Range("オーダー!CB56").Value

UserForm36.Label21.Caption = Range("オーダー!CC47").Value
UserForm36.Label22.Caption = Range("オーダー!CC48").Value
UserForm36.Label23.Caption = Range("オーダー!CC49").Value
UserForm36.Label24.Caption = Range("オーダー!CC50").Value
UserForm36.Label25.Caption = Range("オーダー!CC51").Value
UserForm36.Label26.Caption = Range("オーダー!CC52").Value
UserForm36.Label27.Caption = Range("オーダー!CC53").Value
UserForm36.Label28.Caption = Range("オーダー!CC54").Value
UserForm36.Label29.Caption = Range("オーダー!CC55").Value
UserForm36.Label30.Caption = Range("オーダー!CC56").Value

UserForm36.Label31.Caption = Range("オーダー!CD47").Value
UserForm36.Label32.Caption = Range("オーダー!CD48").Value
UserForm36.Label33.Caption = Range("オーダー!CD49").Value
UserForm36.Label34.Caption = Range("オーダー!CD50").Value
UserForm36.Label35.Caption = Range("オーダー!CD51").Value
UserForm36.Label36.Caption = Range("オーダー!CD52").Value
UserForm36.Label37.Caption = Range("オーダー!CD53").Value
UserForm36.Label38.Caption = Range("オーダー!CD54").Value
UserForm36.Label39.Caption = Range("オーダー!CD55").Value
UserForm36.Label40.Caption = Range("オーダー!CD56").Value

UserForm36.Show

End Sub




Sub 成績()

Sheets("チーム成績").Calculate
Sheets("成績").Calculate
Sheets("成績").Select
Range("A1").Select

End Sub

Sub 野手成績()
Sheets("野手成績").Calculate
Sheets("成績").Calculate
Sheets("成績").Select
Range("A110").Select

End Sub

Sub 投手成績()
Sheets("投手成績").Calculate
Sheets("成績").Calculate
Sheets("成績").Select
Range("A210").Select

End Sub

Sub カレンダー()

Range("カレンダー!BA1").Value = Range("data!C9").Value
Sheets("カレンダー").Calculate
Sheets("カレンダー").Select


End Sub

Sub 采配()


If Range("data!C2") > 41004 Then
    If Range("オーダー!BL1") = 28 Then
    Sheets("オーダー").Calculate
    Range("オーダー!BJ2:BJ10").Value = Range("オーダー!B2:C10").Value
    Range("オーダー!Bk2:Bk10").Value = Range("オーダー!D2:H10").Value
    Range("オーダー!Bk11:Bk29").Value = Range("オーダー!b11:b29").Value
    End If
    Sheets("采配").Calculate
    Sheets("采配").Select
Else
    MsgBox "シーズン開幕までお待ちください"
End If


End Sub

Sub 記録室()
Sheets("記録室").Calculate
Sheets("記録室").Select

End Sub

Sub 補強()
Sheets("補強").Calculate
Sheets("補強").Select

End Sub

Sub オーダー決定準備()

If Range("data!C2") = 41005 Then
    Sheets("オーダー").Calculate
End If

Range("オーダー決定!C5:C13").Value = Range("オーダー!b2:b10").Value
Range("オーダー決定!d5:p13").Value = Range("オーダー!d2:d10").Value
Range("オーダー決定!d15:p21").Value = Range("オーダー!B11:B17").Value
Range("オーダー!Bm18") = ""
Range("オーダー!BZ27:CL33").Calculate

Sheets("オーダー決定").Calculate
Sheets("オーダー決定").Select


End Sub



Sub 球団情報_オーダー表示()


Range("data!C102:J129").Calculate

With team_info
    .pl1pos.Caption = Range("data!C102")
    .pl2pos.Caption = Range("data!C103")
    .pl3pos.Caption = Range("data!C104")
    .pl4pos.Caption = Range("data!C105")
    .pl5pos.Caption = Range("data!C106")
    .pl6pos.Caption = Range("data!C107")
    .pl7pos.Caption = Range("data!C108")
    .pl8pos.Caption = Range("data!C109")
    .pl9pos.Caption = Range("data!C110")
    .pl10pos.Caption = Range("data!C111")
    .pl11pos.Caption = Range("data!C112")
    .pl12pos.Caption = Range("data!C113")
    .pl13pos.Caption = Range("data!C114")
    .pl14pos.Caption = Range("data!C115")
    .pl15pos.Caption = Range("data!C116")
    .pl16pos.Caption = Range("data!C117")
    .pl1.Caption = Range("data!D102")
    .pl2.Caption = Range("data!D103")
    .pl3.Caption = Range("data!D104")
    .pl4.Caption = Range("data!D105")
    .pl5.Caption = Range("data!D106")
    .pl6.Caption = Range("data!D107")
    .pl7.Caption = Range("data!D108")
    .pl8.Caption = Range("data!D109")
    .pl9.Caption = Range("data!D110")
    .pl10.Caption = Range("data!D111")
    .pl11.Caption = Range("data!D112")
    .pl12.Caption = Range("data!D113")
    .pl13.Caption = Range("data!D114")
    .pl14.Caption = Range("data!D115")
    .pl15.Caption = Range("data!D116")
    .pl16.Caption = Range("data!D117")
    .pl1avg.Caption = Range("data!E102")
    .pl2avg.Caption = Range("data!E103")
    .pl3avg.Caption = Range("data!E104")
    .pl4avg.Caption = Range("data!E105")
    .pl5avg.Caption = Range("data!E106")
    .pl6avg.Caption = Range("data!E107")
    .pl7avg.Caption = Range("data!E108")
    .pl8avg.Caption = Range("data!E109")
    .pl9avg.Caption = Range("data!E110")
    .pl10avg.Caption = Range("data!E111")
    .pl11avg.Caption = Range("data!E112")
    .pl12avg.Caption = Range("data!E113")
    .pl13avg.Caption = Range("data!E114")
    .pl14avg.Caption = Range("data!E115")
    .pl15avg.Caption = Range("data!E116")
    .pl16avg.Caption = Range("data!E117")
    .pl1hr.Caption = Range("data!F102")
    .pl2hr.Caption = Range("data!F103")
    .pl3hr.Caption = Range("data!F104")
    .pl4hr.Caption = Range("data!F105")
    .pl5hr.Caption = Range("data!F106")
    .pl6hr.Caption = Range("data!F107")
    .pl7hr.Caption = Range("data!F108")
    .pl8hr.Caption = Range("data!F109")
    .pl9hr.Caption = Range("data!F110")
    .pl10hr.Caption = Range("data!F111")
    .pl11hr.Caption = Range("data!F112")
    .pl12hr.Caption = Range("data!F113")
    .pl13hr.Caption = Range("data!F114")
    .pl14hr.Caption = Range("data!F115")
    .pl15hr.Caption = Range("data!F116")
    .pl16hr.Caption = Range("data!F117")
    .pl1rbi.Caption = Range("data!G102")
    .pl2rbi.Caption = Range("data!G103")
    .pl3rbi.Caption = Range("data!G104")
    .pl4rbi.Caption = Range("data!G105")
    .pl5rbi.Caption = Range("data!G106")
    .pl6rbi.Caption = Range("data!G107")
    .pl7rbi.Caption = Range("data!G108")
    .pl8rbi.Caption = Range("data!G109")
    .pl9rbi.Caption = Range("data!G110")
    .pl10rbi.Caption = Range("data!G111")
    .pl11rbi.Caption = Range("data!G112")
    .pl12rbi.Caption = Range("data!G113")
    .pl13rbi.Caption = Range("data!G114")
    .pl14rbi.Caption = Range("data!G115")
    .pl15rbi.Caption = Range("data!G116")
    .pl16rbi.Caption = Range("data!G117")
    .pl1sb.Caption = Range("data!H102")
    .pl2sb.Caption = Range("data!H103")
    .pl3sb.Caption = Range("data!H104")
    .pl4sb.Caption = Range("data!H105")
    .pl5sb.Caption = Range("data!H106")
    .pl6sb.Caption = Range("data!H107")
    .pl7sb.Caption = Range("data!H108")
    .pl8sb.Caption = Range("data!H109")
    .pl9sb.Caption = Range("data!H110")
    .pl10sb.Caption = Range("data!H111")
    .pl11sb.Caption = Range("data!H112")
    .pl12sb.Caption = Range("data!H113")
    .pl13sb.Caption = Range("data!H114")
    .pl14sb.Caption = Range("data!H115")
    .pl15sb.Caption = Range("data!H116")
    .pl16sb.Caption = Range("data!H117")
    .pl1obp.Caption = Range("data!I102")
    .pl2obp.Caption = Range("data!I103")
    .pl3obp.Caption = Range("data!I104")
    .pl4obp.Caption = Range("data!I105")
    .pl5obp.Caption = Range("data!I106")
    .pl6obp.Caption = Range("data!I107")
    .pl7obp.Caption = Range("data!I108")
    .pl8obp.Caption = Range("data!I109")
    .pl9obp.Caption = Range("data!I110")
    .pl10obp.Caption = Range("data!I111")
    .pl11obp.Caption = Range("data!I112")
    .pl12obp.Caption = Range("data!I113")
    .pl13obp.Caption = Range("data!I114")
    .pl14obp.Caption = Range("data!I115")
    .pl15obp.Caption = Range("data!I116")
    .pl16obp.Caption = Range("data!I117")
    
    .pl1posp.Caption = Range("data!C118")
    .pl2posp.Caption = Range("data!C119")
    .pl3posp.Caption = Range("data!C120")
    .pl4posp.Caption = Range("data!C121")
    .pl5posp.Caption = Range("data!C122")
    .pl6posp.Caption = Range("data!C123")
    .pl7posp.Caption = Range("data!C124")
    .pl8posp.Caption = Range("data!C125")
    .pl9posp.Caption = Range("data!C126")
    .pl10posp.Caption = Range("data!C127")
    .pl11posp.Caption = Range("data!C128")
    .pl12posp.Caption = Range("data!C129")
    .pl1p.Caption = Range("data!D118")
    .pl2p.Caption = Range("data!D119")
    .pl3p.Caption = Range("data!D120")
    .pl4p.Caption = Range("data!D121")
    .pl5p.Caption = Range("data!D122")
    .pl6p.Caption = Range("data!D123")
    .pl7p.Caption = Range("data!D124")
    .pl8p.Caption = Range("data!D125")
    .pl9p.Caption = Range("data!D126")
    .pl10p.Caption = Range("data!D127")
    .pl11p.Caption = Range("data!D128")
    .pl12p.Caption = Range("data!D129")
    .pl1g.Caption = Range("data!E118")
    .pl2g.Caption = Range("data!E119")
    .pl3g.Caption = Range("data!E120")
    .pl4g.Caption = Range("data!E121")
    .pl5g.Caption = Range("data!E122")
    .pl6g.Caption = Range("data!E123")
    .pl7g.Caption = Range("data!E124")
    .pl8g.Caption = Range("data!E125")
    .pl9g.Caption = Range("data!E126")
    .pl10g.Caption = Range("data!E127")
    .pl11g.Caption = Range("data!E128")
    .pl12g.Caption = Range("data!E129")
    .pl1ip.Caption = Range("data!F118")
    .pl2ip.Caption = Range("data!F119")
    .pl3ip.Caption = Range("data!F120")
    .pl4ip.Caption = Range("data!F121")
    .pl5ip.Caption = Range("data!F122")
    .pl6ip.Caption = Range("data!F123")
    .pl7ip.Caption = Range("data!F124")
    .pl8ip.Caption = Range("data!F125")
    .pl9ip.Caption = Range("data!F126")
    .pl10ip.Caption = Range("data!F127")
    .pl11ip.Caption = Range("data!F128")
    .pl12ip.Caption = Range("data!F129")
    .pl1era.Caption = Range("data!G118")
    .pl2era.Caption = Range("data!G119")
    .pl3era.Caption = Range("data!G120")
    .pl4era.Caption = Range("data!G121")
    .pl5era.Caption = Range("data!G122")
    .pl6era.Caption = Range("data!G123")
    .pl7era.Caption = Range("data!G124")
    .pl8era.Caption = Range("data!G125")
    .pl9era.Caption = Range("data!G126")
    .pl10era.Caption = Range("data!G127")
    .pl11era.Caption = Range("data!G128")
    .pl12era.Caption = Range("data!G129")
    .pl1wl.Caption = Range("data!H118")
    .pl2wl.Caption = Range("data!H119")
    .pl3wl.Caption = Range("data!H120")
    .pl4wl.Caption = Range("data!H121")
    .pl5wl.Caption = Range("data!H122")
    .pl6wl.Caption = Range("data!H123")
    .pl7wl.Caption = Range("data!H124")
    .pl8wl.Caption = Range("data!H125")
    .pl9wl.Caption = Range("data!H126")
    .pl10wl.Caption = Range("data!H127")
    .pl11wl.Caption = Range("data!H128")
    .pl12wl.Caption = Range("data!H129")
    .pl1so.Caption = Range("data!I118")
    .pl2so.Caption = Range("data!I119")
    .pl3so.Caption = Range("data!I120")
    .pl4so.Caption = Range("data!I121")
    .pl5so.Caption = Range("data!I122")
    .pl6so.Caption = Range("data!I123")
    .pl7so.Caption = Range("data!I124")
    .pl8so.Caption = Range("data!I125")
    .pl9so.Caption = Range("data!I126")
    .pl10so.Caption = Range("data!I127")
    .pl11so.Caption = Range("data!I128")
    .pl12so.Caption = Range("data!I129")
End With

End Sub


Sub リーダーズ表示()

Range("data!J48:J50").Calculate

With main_menu
    .title_bat.left = Range("data!J48").Value
    .title_pit.left = Range("data!J49").Value
    .title_pic.left = Range("data!J50").Value
End With

If Range("data!C47") = "3" Then

Range("data!C54:Z60").Calculate

    With main_menu
        .pu_name.left = 476
        .pu_comment.left = 443
        .pu_age.left = 448.5
        .pu_pos.left = 448.5
        .pu_stats1.left = 504
        .pu_stats2.left = 534
        .pu_stats3.left = 564
        .pu_stats4.left = 594
        .pu_stats5.left = 624
    
        .Image_pickup.left = 437
        .pu_name.Caption = Range("data!C54").Value
        .pu_comment.Caption = Range("data!C57").Value
        .Controls("pu_logo" & Range("data!N54")).left = 442.5
        .pu_image_rh.left = Range("data!T54").Value
        .pu_image_lh.left = Range("data!U54").Value
        .pu_image_bh.left = Range("data!V54").Value
        .pu_image_rp.left = Range("data!W54").Value
        .pu_image_lp.left = Range("data!X54").Value
        .pu_stats_type1.left = Range("data!Y54").Value
        .pu_stats_type2.left = Range("data!Z54").Value
        .pu_age.Caption = Range("data!D54").Value & "歳"
        .pu_pos.Caption = Range("data!E54").Value
        .pu_stats1.Caption = Range("data!C56").Value
        .pu_stats2.Caption = Range("data!D56").Value
        .pu_stats3.Caption = Range("data!E56").Value
        .pu_stats4.Caption = Range("data!F56").Value
        .pu_stats5.Caption = Range("data!G56").Value
    End With
Else
    Range("data!IA1:IE1000").Calculate
    Range("data!C48:M53").Calculate
    With main_menu
        'ピックアップの部品すべて除去
        .Image_pickup.left = 1000
        .pu_name.left = 1000
        .pu_comment.left = 1000
        .pu_logo1.left = 1000
        .pu_logo2.left = 1000
        .pu_logo3.left = 1000
        .pu_logo4.left = 1000
        .pu_logo5.left = 1000
        .pu_logo6.left = 1000
        .pu_image_rh.left = 1000
        .pu_image_lh.left = 1000
        .pu_image_bh.left = 1000
        .pu_image_rp.left = 1000
        .pu_image_lp.left = 1000
        .pu_stats_type1.left = 1000
        .pu_stats_type2.left = 1000
        .pu_age.left = 1000
        .pu_pos.left = 1000
        .pu_stats1.left = 1000
        .pu_stats2.left = 1000
        .pu_stats3.left = 1000
        .pu_stats4.left = 1000
        .pu_stats5.left = 1000
        
        .Image_pickup.left = 1000
        .le_item1.Caption = Range("data!G48").Value
        .le_item2.Caption = Range("data!G49").Value
        .le_item3.Caption = Range("data!G50").Value
        .le_item4.Caption = Range("data!G51").Value
        .le_item1.ForeColor = RGB(Range("data!K48").Value, Range("data!L48").Value, Range("data!M48").Value)
        .le_item2.ForeColor = RGB(Range("data!K49").Value, Range("data!L49").Value, Range("data!M49").Value)
        .le_item3.ForeColor = RGB(Range("data!K50").Value, Range("data!L50").Value, Range("data!M50").Value)
        .le_item4.ForeColor = RGB(Range("data!K51").Value, Range("data!L51").Value, Range("data!M51").Value)
        .le_item1.Font.Bold = Range("data!H48").Value
        .le_item2.Font.Bold = Range("data!H49").Value
        .le_item3.Font.Bold = Range("data!H50").Value
        .le_item4.Font.Bold = Range("data!H51").Value
        .le_player1.Caption = Range("data!C48").Value
        .le_player2.Caption = Range("data!C49").Value
        .le_player3.Caption = Range("data!C50").Value
        .le_player4.Caption = Range("data!C51").Value
        .le_player5.Caption = Range("data!C52").Value
        .le_player6.Caption = Range("data!C53").Value
        .le_team1.Caption = Range("data!D48").Value
        .le_team2.Caption = Range("data!D49").Value
        .le_team3.Caption = Range("data!D50").Value
        .le_team4.Caption = Range("data!D51").Value
        .le_team5.Caption = Range("data!D52").Value
        .le_team6.Caption = Range("data!D53").Value
        .le_stats1.Caption = Range("data!E48").Value
        .le_stats2.Caption = Range("data!E49").Value
        .le_stats3.Caption = Range("data!E50").Value
        .le_stats4.Caption = Range("data!E51").Value
        .le_stats5.Caption = Range("data!E52").Value
        .le_stats6.Caption = Range("data!E53").Value
    End With
End If

End Sub

Sub シート上選手オープン()

Range("data!C301:AK509").Calculate
Range("data!C301").Value = ActiveCell.Value
Call 選手データオープン

End Sub

Sub 選手データオープン()

Dim i As Long
Range("data!IF1:IG1000").Calculate
Range("data!C301:AK509").Calculate

If Range("data!D301").Value = "現役引退" Then
    player_data.Show
Else
        'グラフ設置
    If Range("data!F301") = 1 Then
10     Worksheets("data").ChartObjects(2).Chart.Export ThisWorkbook.Path & "\Chart2.gif"
20     player_data.transition_graph.Picture = LoadPicture(ThisWorkbook.Path & "\Chart2.gif")
    Else
    
        With Sheets("data").ChartObjects(1).Chart.SeriesCollection(1)
            For i = 1 To .Points.Count
                .Points(i).Interior.Color = Sheets("data").Cells(316, 12 + i).Value
            Next i
        End With
    
    Worksheets("data").ChartObjects(1).Chart.Export ThisWorkbook.Path & "\Chart1.gif"
    player_data.movement_graph.Picture = LoadPicture(ThisWorkbook.Path & "\Chart1.gif")
    
    Worksheets("data").ChartObjects(3).Chart.Export ThisWorkbook.Path & "\Chart3.gif"
    player_data.transition_graph.Picture = LoadPicture(ThisWorkbook.Path & "\Chart3.gif")
    
    End If
    
30     player_data.Show

End If

End Sub

Sub グラフ設置()

Dim i As Long

    With Sheets("data").ChartObjects(1).Chart.SeriesCollection(1)
        For i = 1 To .Points.Count
            .Points(i).Interior.Color = Sheets("data").Cells(316, 12 + i).Value
        Next i
    End With

End Sub

Sub 成績画面()

On Error GoTo myError
With player_data
    .movement_graph.left = 700
    .tag_profile.left = 700
    .tag_rating.left = 700
    .tag_stats.left = 514
    
    .back_stats.left = 0
    .stats_season.left = 4.5
    .stats_career.left = 67
    .stats_gamelog.left = 129
    
    If Range("data!AI340") = 2 Then
        Call 成績2ロード
    ElseIf Range("data!AI340") = 3 Then
        Call 成績3ロード
    Else
        Call 成績1ロード
    End If
End With

myError:

End Sub
Sub 成績1ロード()

Range("data!AI340") = 1

With player_data
    .morestats.left = 700
    .stats_kirikae_1.left = 4.5
    .stats_kirikae_2.left = 700
    .stats_kirikae_3.left = 700
    
    .statsbarhider.left = 700
    .ComboBox1.left = 700
    .statsbar.left = 700
    .ScrollBar1.left = 700
    If Range("data!F301") = 1 Then
        Range("data!AM376:BE395").Calculate
        .statssheet2.left = 3
    Else
        Range("data!AM418:BE423").Calculate
        .statssheet2_p.left = 3
    End If
    .statssheet.left = 700
    .statsline.left = 700
    .statshider.left = 700
    
    .hiderR.left = 700
    .hiderL.left = 700
    
    .logbar1.left = 700
    .logbar2.left = 700
    
    Dim r As Byte
    Dim c As Byte
    For r = 1 To 17
        For c = 1 To 19
            If Not r Mod 2 = 0 And r < 28 - Range("data!F301") * 12 Then
                If Not c = 1 Then
                    .Controls("Label" & r * 19 + (20 - c) - 19).Font.Name = "HGSｺﾞｼｯｸM"
                    .Controls("Label" & r * 19 + (20 - c) - 19).Width = 31
                End If
                .Controls("Label" & r * 19 + (20 - c) - 19).Caption = Sheets("data").Cells(334 + Range("data!F301") * 42 + r, 38 + c)
            Else
                .Controls("Label" & r * 19 + (20 - c) - 19).Caption = ""
            End If
        Next
    Next
End With

End Sub

Sub 成績2ロード()

Range("data!AH340") = ""
Range("data!AI340") = 2
With player_data
    .stats_kirikae_1.left = 700
    .stats_kirikae_2.left = 67
    .stats_kirikae_3.left = 700
    
    .ComboBox1.left = 438
    .ComboBox1.ListIndex = 0
    
    Range("data!AK340").Value = "1"
    Range("data!AM342:CA395").Calculate
    If Range("data!O344") > 16 Then
        .morestats.left = 0
    Else
        .morestats.left = 700
    End If
    
    .ScrollBar1.left = 700
    .statssheet2.left = 700
    .statssheet2_p.left = 700
    .statssheet.left = 3
    .statsline.left = 3
    .statsline.Top = 107 + Range("data!AJ340") * 15
    .statshider.left = 0
    .statshider.Top = 122 + Range("data!AJ340") * 15
    
    .hiderR.left = 700
    .hiderL.left = 700
    
    .logbar1.left = 700
    .logbar2.left = 700
    
    Dim r As Byte
    Dim c As Byte
    For r = 1 To 17
        For c = 1 To 19
            .Controls("Label" & r * 19 + (20 - c) - 19).Caption = Sheets("data").Cells(343 + r, 38 + c)
            If Not c = 1 Then
                .Controls("Label" & r * 19 + (20 - c) - 19).Font.Name = "HGSｺﾞｼｯｸM"
                .Controls("Label" & r * 19 + (20 - c) - 19).Width = 31
            End If
        Next
    Next
End With

End Sub

Sub 成績3ロード()

Range("data!AI340") = 3

With player_data
    .morestats.left = 700
    .stats_kirikae_1.left = 700
    .stats_kirikae_2.left = 700
    .stats_kirikae_3.left = 129
    
    .statsbarhider.left = 700
    .ComboBox1.left = 700
    .statsbar.left = 700
    .ScrollBar1.left = 583.5
    .ScrollBar1.Max = Range("data!AN416")
    
    If Range("data!C2") - 41000 - 17 > 0 Then
        Range("data!AM416").Value = Range("data!C2") - 41000 - 17
    Else
        Range("data!AM416").Value = 0
    End If
    Range("data!AL398:BE416").Calculate
    
    .statssheet.left = 3
    .statssheet2.left = 700
    .statssheet2_p.left = 700
    .statsline.left = 700
    .statshider.left = 700
    
    .hiderR.left = 700
    .hiderL.left = 700
    
    .Controls("logbar" & Range("data!F301")).left = 3
    
    Dim r As Byte
    Dim c As Byte
    For r = 1 To 17
        For c = 1 To 19
            .Controls("Label" & r * 19 + (20 - c) - 19).Caption = Sheets("data").Cells(397 + r, 38 + c)
            If c = 3 Then
                .Controls("Label" & r * 19 + (20 - c) - 19).Font.Name = "ＭＳ Ｐゴシック"
                .Controls("Label" & r * 19 + (20 - c) - 19).Width = 124
            ElseIf c > 11 And c < 18 And Range("data!Ap416") = 1 Then
                .Controls("Label" & r * 19 + (20 - c) - 19).Font.Name = "ＭＳ Ｐゴシック"
            End If
        Next
    Next
End With

End Sub

Sub ストーブリーグリペイント()

Range("data!BW1121:BW1270").Calculate
Range("data!L1122:P1114").Calculate

With stove_league
    With .ListBox1
        .ColumnCount = 6
        .ColumnWidths = "80;30;30,80,150,80"
        .RowSource = "data!E1273:J" & Range("data!D1272")
        .ColumnHeads = True
    End With
    .turn.Caption = Range("data!C1106")
    .yosan1.Caption = Range("data!L1114")
    .yosan2.Caption = Range("data!M1114")
    .yosan3.Caption = Range("data!N1114")
    .yosan4.Caption = Range("data!O1114")
    .ninzu1.Caption = Range("FA選手!DY4")
    .ninzu2.Caption = Range("FA選手!DY5")
    .ninzu3.Caption = Range("FA選手!DY6")
    .ninzu4.Caption = Range("FA選手!DY7")
    .ninzu5.Caption = Range("FA選手!DY8")
    .ninzu6.Caption = Range("FA選手!DY9")
    .ninzu7.Caption = Range("FA選手!DY10")
    .ninzu8.Caption = Range("FA選手!DY11")
    .ninzu9.Caption = Range("FA選手!DY12")
    .hyoka1.Caption = Range("FA選手!DX14")
    .hyoka2.Caption = Range("FA選手!DX15")
End With

End Sub

Sub 画面表示()

If Range("data!C61") = 2 Then
    stove_league.Show
Else
    main_menu.Show
End If

End Sub

Sub メイン画面セット_試合後()

With main_menu
    '順位表更新
    .st_rank1.Caption = Range("data!B14").Value
    .st_rank2.Caption = Range("data!B15").Value
    .st_rank3.Caption = Range("data!B16").Value
    .st_rank4.Caption = Range("data!B17").Value
    .st_rank5.Caption = Range("data!B18").Value
    .st_rank6.Caption = Range("data!B19").Value
    .st_team1.Caption = Range("data!C14").Value
    .st_team2.Caption = Range("data!C15").Value
    .st_team3.Caption = Range("data!C16").Value
    .st_team4.Caption = Range("data!C17").Value
    .st_team5.Caption = Range("data!C18").Value
    .st_team6.Caption = Range("data!C19").Value
    .st_behind1.Caption = Range("data!D14").Value
    .st_behind2.Caption = Range("data!D15").Value
    .st_behind3.Caption = Range("data!D16").Value
    .st_behind4.Caption = Range("data!D17").Value
    .st_behind5.Caption = Range("data!D18").Value
    .st_behind6.Caption = Range("data!D19").Value
    .st_pct1.Caption = Range("data!E14").Value
    .st_pct2.Caption = Range("data!E15").Value
    .st_pct3.Caption = Range("data!E16").Value
    .st_pct4.Caption = Range("data!E17").Value
    .st_pct5.Caption = Range("data!E18").Value
    .st_pct6.Caption = Range("data!E19").Value
    
    'リーダーズ更新
    Range("data!C47").Value = "=INT(RAND()*3+1)"
    Range("data!D47").Value = "=INT(RAND()*4+1)"
    Call リーダーズ表示
    
    .beforegame.left = 1000
    .aftergame.left = 194
    
    .score1.Caption = Range("data!C41").Value
    .score2.Caption = Range("data!D41").Value
    
    .news_message1.Caption = Range("data!C42").Value
    .news_message2.Caption = Range("data!D42").Value
    .news_message3.Caption = Range("data!E42").Value
    .news_message4.Caption = Range("data!F42").Value
    .news_message5.Caption = Range("data!G42").Value
    .news_message6.Caption = Range("data!H42").Value

    .news1.left = Range("data!C44").Value
    .news2.left = Range("data!D44").Value
    .news3.left = Range("data!E44").Value
    .news4.left = Range("data!F44").Value
    .news5.left = Range("data!G44").Value
    .news6.left = Range("data!H44").Value
    .news7.left = Range("data!I44").Value
    .news8.left = Range("data!J44").Value
    .news9.left = Range("data!K44").Value
    .news10.left = Range("data!L44").Value
    .news11.left = Range("data!M44").Value
    .news12.left = Range("data!N44").Value
    
    .point1.BackStyle = Range("data!I42").Value
    .point2.BackStyle = Range("data!J42").Value
    .point3.BackStyle = Range("data!K42").Value
    .point4.BackStyle = Range("data!L42").Value
    .point5.BackStyle = Range("data!M42").Value
    .point6.BackStyle = Range("data!N42").Value
    
    If Range("data!C36") = "" Then
        .Label_game.Caption = ""
    Else
        .Label_game.Caption = "結果を見る"
    End If
    .sinko_bar1.left = 1000
    .sinko_bar2.left = 1000
    
    '進行ボタンだす
    .nitteinext.left = 405
End With

End Sub

Sub メイン画面セット_日程進行()

With main_menu
    .date_back.Caption = Range("data!C1").Value
    .date_top.Caption = Range("data!C1").Value
    .Label_game.Caption = ""
    
    If Range("data!C5") = "午前" Then

        '進行ボタンだす
        .nitteinext.left = 405
        'ニュース更新
        .news_message1.Caption = Range("data!C45").Value
        .news_message2.Caption = Range("data!D45").Value
        .news_message3.Caption = Range("data!E45").Value
        .news_message4.Caption = Range("data!F45").Value
        .news_message5.Caption = Range("data!G45").Value
        .news_message6.Caption = Range("data!H45").Value
        'ポイント
        .point1.BackStyle = Range("data!K45").Value
        .point2.BackStyle = Range("data!L45").Value
        .point3.BackStyle = Range("data!M45").Value
        .point4.BackStyle = Range("data!N45").Value
        .point5.BackStyle = Range("data!O45").Value
        .point6.BackStyle = Range("data!P45").Value
    Else

        '試合あるなら試合ボタンだす　ないなら進行ボタン
        If Range("data!C36") = "" And Range("data!C37") = "" And Range("data!C38") = "" Then
            .nitteinext.left = 405
        Else
            .gamestart.left = 168
            .Label_date.Caption = ""
        End If
        'ニュース更新
        Range("data!C45:Q45").Calculate
        .news_message1.Caption = Range("data!C46").Value
        .news_message2.Caption = Range("data!D46").Value
        .news_message3.Caption = Range("data!E46").Value
        .news_message4.Caption = Range("data!F46").Value
        .news_message5.Caption = Range("data!G46").Value
        .news_message6.Caption = Range("data!H46").Value
        'ポイント
        .point1.BackStyle = Range("data!K46").Value
        .point2.BackStyle = Range("data!L46").Value
        .point3.BackStyle = Range("data!M46").Value
        .point4.BackStyle = Range("data!N46").Value
        .point5.BackStyle = Range("data!O46").Value
        .point6.BackStyle = Range("data!P46").Value
        '優勝済か
        If Range("data!D14") = "優勝" And Range("data!D7") = "" Then
            Range("data!D7") = "済"
        End If
        'マジック済か
        If Not Range("data!C9") = 4 And Not Range("data!D14") = "-" And Range("data!D8") = "" Then
            Range("data!D8") = "済"
        End If
    End If
    
    If Range("data!C40").Value > 1 Then
        .beforegame.left = 194
        .aftergame.left = 1000
    Else
        .beforegame.left = 1000
        .aftergame.left = 1000
    End If
    
    .score1.Caption = ""
    .score2.Caption = ""
    
    .hawks1.left = Range("data!F38").Value
    .hawks2.left = Range("data!F38").Value
    .lions1.left = Range("data!G38").Value
    .lions2.left = Range("data!G38").Value
    .fighters1.left = Range("data!H38").Value
    .fighters2.left = Range("data!H38").Value
    .buffaloes1.left = Range("data!I38").Value
    .buffaloes2.left = Range("data!I38").Value
    .eagles1.left = Range("data!J38").Value
    .eagles2.left = Range("data!J38").Value
    .marines1.left = Range("data!K38").Value
    .marines2.left = Range("data!K38").Value
    
    .news1.left = 1000
    .news2.left = 1000
    .news3.left = 1000
    .news4.left = 1000
    .news5.left = 1000
    .news6.left = 1000
    .news7.left = 1000
    .news8.left = 1000
    .news9.left = 1000
    .news10.left = 1000
    .news11.left = 1000
    .news12.left = 1000
    
    'オフへ？
    If Range("data!F19") >= 140 Then
        .Label_date.Caption = ""
        .nitteinext.left = 1000
        .season_end.left = 0
        .go_to_stove.left = 97
        .season_end_message1.left = 28.5
        .season_end_message2.left = 28.5
        .season_end_message3.left = 28.5
        .season_end_message1.Caption = Range("data!G19").Value
        .season_end_message2.Caption = Range("data!H19").Value
        .season_end_message3.Caption = Range("data!I19").Value
    End If
End With

End Sub
Sub 日程進行ボタン()

With main_menu
    .nitteinext.left = 1000
    .Label_date.Caption = "進行中"
    main_menu.Repaint
End With

Call 日程進行
Call メイン画面セット_日程進行

End Sub

Sub 試合実行ボタン()

'セル上の値更新いったんオフ
Application.ScreenUpdating = False
    
With main_menu
    .gamestart.left = 1000
    .sinko_bar1.Width = 0
    .sinko_bar1.left = 165
    .sinko_bar2.left = 164
    .Label_game.Caption = "試合中"
    main_menu.Repaint
End With

'セル上の値更新いったんオンに戻す
Application.ScreenUpdating = True
    
Call 進行
Call 試合後更新
Call メイン画面セット_試合後

End Sub
