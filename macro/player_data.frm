VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} player_data 
   ClientHeight    =   7500
   ClientLeft      =   50
   ClientTop       =   380
   ClientWidth     =   11970
   OleObjectBlob   =   "player_data.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "player_data"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

Private Sub item_select_button_Click()

item_select.left = 216
s3item1.left = 217.5
s3item2.left = 299.5
s3item3.left = 217.5
s3item4.left = 299.5
s3item5.left = 217.5
s3item6.left = 299.5
s3item7.left = 217.5
s3item8.left = 299.5
s3item9.left = 217.5
s3item10.left = 299.5
s3item11.left = 217.5
s3item12.left = 299.5

End Sub




Private Sub back_yashu_Click()

End Sub

Private Sub ComboBox1_Change()

On Error GoTo myError

Range("data!AK340") = ComboBox1.ListIndex + 1

If Range("data!AK340") > 9 Then
    Range("data!AK340") = 9
End If

statsbar.left = -5884.5 + (ComboBox1.ListIndex + Range("data!F301") * 9 - 9) * 539.9
statsbarhider.left = 0

Range("data!AM344:CA374").Calculate

Dim r As Byte
Dim c As Byte
For r = 1 To 17
    For c = 1 To 19
        Controls("Label" & r * 19 + (20 - c) - 19).Caption = Sheets("data").Cells(343 + r, 38 + c)
        If ComboBox1.ListIndex = ComboBox1.ListRows - 1 Then
            If c = 2 Then
                Controls("Label" & r * 19 + (20 - c) - 19).Width = 31 * 3
            ElseIf c = 5 Then
                Controls("Label" & r * 19 + (20 - c) - 19).Font.Name = "ＭＳ Ｐゴシック"
                Controls("Label" & r * 19 + (20 - c) - 19).Width = 31 * 5
            ElseIf c = 10 Then
                Controls("Label" & r * 19 + (20 - c) - 19).Font.Name = "ＭＳ Ｐゴシック"
                Controls("Label" & r * 19 + (20 - c) - 19).Width = 31 * 10
            End If
        Else
            If Not c = 1 Then
                Controls("Label" & r * 19 + (20 - c) - 19).Font.Name = "HGSｺﾞｼｯｸM"
                Controls("Label" & r * 19 + (20 - c) - 19).Width = 31
            End If
        End If
    Next
Next

myError:


End Sub

Private Sub kaiko_Click()

Range("data!M" & Range("data!L1001").Value + 1001) = "1"
MsgBox Range("data!C301") & "選手を解雇しました。選手は自由契約となります。"
Unload Me

End Sub

Private Sub keiyaku_Click()

Range("data!C1103").Value = Range("data!C301").Value
keiyaku_teiji.Show

End Sub


Private Sub konbato_Click()

convert_select.Show

End Sub



Private Sub s3item1_Click()

Range("data!C306") = 1
Range("data!K310:K508").Calculate
Range("data!C306:H307").Calculate

s3_label.Caption = Range("data!D306")
s301.Caption = Range("data!C307")
s302.Caption = Range("data!D307")
s303.Caption = Range("data!E307")
s304.Caption = Range("data!F307")
s305.Caption = Range("data!G307")
s306.Caption = Range("data!H307")

item_select.left = 650
s3item1.left = 650
s3item2.left = 650
s3item3.left = 650
s3item4.left = 650
s3item5.left = 650
s3item6.left = 650
s3item7.left = 650
s3item8.left = 650
s3item9.left = 650
s3item10.left = 650
s3item11.left = 650
s3item12.left = 650

End Sub

Private Sub s3item2_Click()

Range("data!C306") = 2
Range("data!K310:K508").Calculate
Range("data!C306:H307").Calculate

s3_label.Caption = Range("data!D306")
s301.Caption = Range("data!C307")
s302.Caption = Range("data!D307")
s303.Caption = Range("data!E307")
s304.Caption = Range("data!F307")
s305.Caption = Range("data!G307")
s306.Caption = Range("data!H307")

item_select.left = 650
s3item1.left = 650
s3item2.left = 650
s3item3.left = 650
s3item4.left = 650
s3item5.left = 650
s3item6.left = 650
s3item7.left = 650
s3item8.left = 650
s3item9.left = 650
s3item10.left = 650
s3item11.left = 650
s3item12.left = 650

End Sub

Private Sub s3item3_Click()

Range("data!C306") = 3
Range("data!K310:K508").Calculate
Range("data!C306:H307").Calculate

s3_label.Caption = Range("data!D306")
s301.Caption = Range("data!C307")
s302.Caption = Range("data!D307")
s303.Caption = Range("data!E307")
s304.Caption = Range("data!F307")
s305.Caption = Range("data!G307")
s306.Caption = Range("data!H307")

item_select.left = 650
s3item1.left = 650
s3item2.left = 650
s3item3.left = 650
s3item4.left = 650
s3item5.left = 650
s3item6.left = 650
s3item7.left = 650
s3item8.left = 650
s3item9.left = 650
s3item10.left = 650
s3item11.left = 650
s3item12.left = 650

End Sub

Private Sub s3item4_Click()

Range("data!C306") = 4
Range("data!K310:K508").Calculate
Range("data!C306:H307").Calculate

s3_label.Caption = Range("data!D306")
s301.Caption = Range("data!C307")
s302.Caption = Range("data!D307")
s303.Caption = Range("data!E307")
s304.Caption = Range("data!F307")
s305.Caption = Range("data!G307")
s306.Caption = Range("data!H307")

item_select.left = 650
s3item1.left = 650
s3item2.left = 650
s3item3.left = 650
s3item4.left = 650
s3item5.left = 650
s3item6.left = 650
s3item7.left = 650
s3item8.left = 650
s3item9.left = 650
s3item10.left = 650
s3item11.left = 650
s3item12.left = 650

End Sub

Private Sub s3item5_Click()

Range("data!C306") = 5
Range("data!K310:K508").Calculate
Range("data!C306:H307").Calculate

s3_label.Caption = Range("data!D306")
s301.Caption = Range("data!C307")
s302.Caption = Range("data!D307")
s303.Caption = Range("data!E307")
s304.Caption = Range("data!F307")
s305.Caption = Range("data!G307")
s306.Caption = Range("data!H307")

item_select.left = 650
s3item1.left = 650
s3item2.left = 650
s3item3.left = 650
s3item4.left = 650
s3item5.left = 650
s3item6.left = 650
s3item7.left = 650
s3item8.left = 650
s3item9.left = 650
s3item10.left = 650
s3item11.left = 650
s3item12.left = 650

End Sub

Private Sub s3item6_Click()

Range("data!C306") = 6
Range("data!K310:K508").Calculate
Range("data!C306:H307").Calculate

s3_label.Caption = Range("data!D306")
s301.Caption = Range("data!C307")
s302.Caption = Range("data!D307")
s303.Caption = Range("data!E307")
s304.Caption = Range("data!F307")
s305.Caption = Range("data!G307")
s306.Caption = Range("data!H307")

item_select.left = 650
s3item1.left = 650
s3item2.left = 650
s3item3.left = 650
s3item4.left = 650
s3item5.left = 650
s3item6.left = 650
s3item7.left = 650
s3item8.left = 650
s3item9.left = 650
s3item10.left = 650
s3item11.left = 650
s3item12.left = 650

End Sub

Private Sub s3item7_Click()

Range("data!C306") = 7
Range("data!K310:K508").Calculate
Range("data!C306:H307").Calculate

s3_label.Caption = Range("data!D306")
s301.Caption = Range("data!C307")
s302.Caption = Range("data!D307")
s303.Caption = Range("data!E307")
s304.Caption = Range("data!F307")
s305.Caption = Range("data!G307")
s306.Caption = Range("data!H307")

item_select.left = 650
s3item1.left = 650
s3item2.left = 650
s3item3.left = 650
s3item4.left = 650
s3item5.left = 650
s3item6.left = 650
s3item7.left = 650
s3item8.left = 650
s3item9.left = 650
s3item10.left = 650
s3item11.left = 650
s3item12.left = 650

End Sub

Private Sub s3item8_Click()

Range("data!C306") = 8
Range("data!K310:K508").Calculate
Range("data!C306:H307").Calculate

s3_label.Caption = Range("data!D306")
s301.Caption = Range("data!C307")
s302.Caption = Range("data!D307")
s303.Caption = Range("data!E307")
s304.Caption = Range("data!F307")
s305.Caption = Range("data!G307")
s306.Caption = Range("data!H307")

item_select.left = 650
s3item1.left = 650
s3item2.left = 650
s3item3.left = 650
s3item4.left = 650
s3item5.left = 650
s3item6.left = 650
s3item7.left = 650
s3item8.left = 650
s3item9.left = 650
s3item10.left = 650
s3item11.left = 650
s3item12.left = 650

End Sub

Private Sub s3item9_Click()

Range("data!C306") = 9
Range("data!K310:K508").Calculate
Range("data!C306:H307").Calculate

s3_label.Caption = Range("data!D306")
s301.Caption = Range("data!C307")
s302.Caption = Range("data!D307")
s303.Caption = Range("data!E307")
s304.Caption = Range("data!F307")
s305.Caption = Range("data!G307")
s306.Caption = Range("data!H307")

item_select.left = 650
s3item1.left = 650
s3item2.left = 650
s3item3.left = 650
s3item4.left = 650
s3item5.left = 650
s3item6.left = 650
s3item7.left = 650
s3item8.left = 650
s3item9.left = 650
s3item10.left = 650
s3item11.left = 650
s3item12.left = 650

End Sub

Private Sub s3item10_Click()

Range("data!C306") = 10
Range("data!K310:K508").Calculate
Range("data!C306:H307").Calculate

s3_label.Caption = Range("data!D306")
s301.Caption = Range("data!C307")
s302.Caption = Range("data!D307")
s303.Caption = Range("data!E307")
s304.Caption = Range("data!F307")
s305.Caption = Range("data!G307")
s306.Caption = Range("data!H307")

item_select.left = 650
s3item1.left = 650
s3item2.left = 650
s3item3.left = 650
s3item4.left = 650
s3item5.left = 650
s3item6.left = 650
s3item7.left = 650
s3item8.left = 650
s3item9.left = 650
s3item10.left = 650
s3item11.left = 650
s3item12.left = 650

End Sub

Private Sub s3item11_Click()

Range("data!C306") = 11
Range("data!K310:K508").Calculate
Range("data!C306:H307").Calculate

s3_label.Caption = Range("data!D306")
s301.Caption = Range("data!C307")
s302.Caption = Range("data!D307")
s303.Caption = Range("data!E307")
s304.Caption = Range("data!F307")
s305.Caption = Range("data!G307")
s306.Caption = Range("data!H307")

item_select.left = 650
s3item1.left = 650
s3item2.left = 650
s3item3.left = 650
s3item4.left = 650
s3item5.left = 650
s3item6.left = 650
s3item7.left = 650
s3item8.left = 650
s3item9.left = 650
s3item10.left = 650
s3item11.left = 650
s3item12.left = 650

End Sub

Private Sub s3item12_Click()

Range("data!C306") = 12
Range("data!K310:K508").Calculate
Range("data!C306:H307").Calculate

s3_label.Caption = Range("data!D306")
s301.Caption = Range("data!C307")
s302.Caption = Range("data!D307")
s303.Caption = Range("data!E307")
s304.Caption = Range("data!F307")
s305.Caption = Range("data!G307")
s306.Caption = Range("data!H307")

item_select.left = 650
s3item1.left = 650
s3item2.left = 650
s3item3.left = 650
s3item4.left = 650
s3item5.left = 650
s3item6.left = 650
s3item7.left = 650
s3item8.left = 650
s3item9.left = 650
s3item10.left = 650
s3item11.left = 650
s3item12.left = 650

End Sub





Private Sub Label250_Click()

End Sub






Private Sub morestats_Click()

Range("AH340").Value = Range("AH340").Value + 1

Range("data!AM342:BE395").Calculate
If Range("data!O344") > 17 Then
    morestats.left = 0
Else
    morestats.left = 700
End If
    
Dim r As Byte
Dim c As Byte
For r = 1 To 17
    For c = 1 To 19
        Controls("Label" & r * 19 + (20 - c) - 19).Caption = Sheets("data").Cells(343 + r + Range("AH340").Value, 38 + c)
        If Not c = 1 Then
            Controls("Label" & r * 19 + (20 - c) - 19).Font.Name = "HGSｺﾞｼｯｸM"
            Controls("Label" & r * 19 + (20 - c) - 19).Width = 31
        End If
    Next
Next

statsline.Top = statsline.Top - 15

If Range("data!O344") > 16 + Range("AH340").Value Then
    morestats.left = 0
Else
    morestats.left = 700
End If
    
End Sub





Private Sub profile_botan_Click()

morestats.left = 700
ComboBox1.left = 700
movement_graph.left = 301
statsbar.left = 700

tag_profile.left = 358
tag_rating.left = 700
tag_stats.left = 700

stats_season.left = 700
stats_career.left = 700
stats_gamelog.left = 700
stats_kirikae_1.left = 700
stats_kirikae_2.left = 700
stats_kirikae_3.left = 700

statsbarhider.left = 700
ScrollBar1.left = 700
hiderR.left = 423
hiderL.left = 336.5
back_stats.left = 700
statssheet.left = 700
statssheet2.left = 700
statssheet2_p.left = 700
statsline.left = 700
statshider.left = 700

logbar1.left = 700
logbar2.left = 700
    
Dim r As Byte
Dim c As Byte
For r = 1 To 17
    For c = 1 To 19
        Controls("Label" & r * 19 + (20 - c) - 19).Caption = ""
    Next
Next

End Sub

Private Sub purotekuto_hazusu_Click()

Range("FA選手!DT" & Range("FA選手!DV42").Value).Value = "プロテクトしない"
Range("FA選手!DT42:DX113").Calculate
Unload Me

End Sub


Private Sub purotekuto_suru_Click()

Range("FA選手!DT" & Range("FA選手!DV42").Value).Value = "プロテクト"
Range("FA選手!DT42:DX113").Calculate
Unload Me

End Sub

Private Sub ScrollBar1_Change()

If Not ScrollBar1.left = 700 Then
    Range("data!AM416").Value = ScrollBar1.Value
    Range("data!AL398:BE416").Calculate
    Dim r As Byte
    Dim c As Byte
    For r = 1 To 17
        For c = 1 To 19
            Controls("Label" & r * 19 + (20 - c) - 19).Caption = Sheets("data").Cells(397 + r, 38 + c)
            If c = 3 Then
                Controls("Label" & r * 19 + (20 - c) - 19).Width = 124
            End If
        Next
    Next
End If

End Sub



Private Sub setting_Click()

player_option.Show

End Sub

Private Sub stats_botan_Click()

Call 成績画面


    
End Sub

Private Sub stats_career_Click()

Call 成績2ロード

End Sub

Private Sub stats_gamelog_Click()

Call 成績3ロード

End Sub

Private Sub stats_season_Click()

Call 成績1ロード

End Sub





Private Sub UserForm_Initialize()

If Range("data!F301") = 2 Then
    ComboBox1.ListRows = 3
Else
    ComboBox1.ListRows = 9
End If

10  For i = 0 To ComboBox1.ListRows - 1
20      ComboBox1.AddItem Worksheets("data").Cells(i + 336 - Range("data!F301") * 3, 39).Value
30  Next
ComboBox1.Style = fmStyleDropDownList

Controls("back_" & Range("data!H301").Value).left = 0
Range("data!AI340") = 1
player_name.Caption = Range("data!J301")
team_name.Caption = Range("data!G301") & Range("data!J302")
Controls("face_" & Range("data!I301").Value).left = 20

'以下現役選手or引退選手で処理分岐
If Range("data!D301") = "現役引退" Then
    Call 成績画面
    Call 成績2ロード
    stats_career.left = 700
    stats_season.left = 700
    stats_gamelog.left = 700
    profile_botan.left = 700
Else
 
    ScrollBar1.Value = Range("data!AN416").Value
    
    If Range("data!L301") = "解雇" Then
        kaiko.left = 415
    ElseIf Range("data!L301") = "契約提示" Then
        keiyaku.left = 415
    ElseIf Range("data!L301") = "プロテクトしない" Then
        purotekuto_suru.left = 415
    ElseIf Range("data!L301") = "プロテクト" Then
        purotekuto_hazusu.left = 415
    ElseIf Range("data!L301") = "コンバート指示" Then
        konbato.left = 415
    End If
    
    pl1.Caption = Range("data!C302")
    pl2.Caption = Range("data!D302")
    pl3.Caption = Range("data!E302")
    pl4.Caption = Range("data!F302")
    pl5.Caption = Range("data!G302")
    pl6.Caption = Range("data!H302")
    pl7.Caption = Range("data!I302")
    pl8.Caption = Range("data!L302")
    
    s100.Caption = Range("data!O380")
    s101.Caption = Range("data!P380")
    s102.Caption = Range("data!Q380")
    s103.Caption = Range("data!R380")
    s104.Caption = Range("data!S380")
    s105.Caption = Range("data!T380")
    s106.Caption = Range("data!U380")
    s107.Caption = Range("data!V380")
    s108.Caption = Range("data!W380")
    s109.Caption = Range("data!X380")
    s110.Caption = Range("data!Y380")
    
    s200.Caption = Range("data!O381")
    s201.Caption = Range("data!P381")
    s202.Caption = Range("data!Q381")
    s203.Caption = Range("data!R381")
    s204.Caption = Range("data!S381")
    s205.Caption = Range("data!T381")
    s206.Caption = Range("data!U381")
    s207.Caption = Range("data!V381")
    s208.Caption = Range("data!W381")
    s209.Caption = Range("data!X381")
    s210.Caption = Range("data!Y381")
    
    s300.Caption = Range("data!O382")
    s301.Caption = Range("data!P382")
    s302.Caption = Range("data!Q382")
    s303.Caption = Range("data!R382")
    s304.Caption = Range("data!S382")
    s305.Caption = Range("data!T382")
    s306.Caption = Range("data!U382")
    s307.Caption = Range("data!V382")
    s308.Caption = Range("data!W382")
    s309.Caption = Range("data!X382")
    s310.Caption = Range("data!Y382")
    
    s400.Caption = Range("data!O383")
    s401.Caption = Range("data!P383")
    s402.Caption = Range("data!Q383")
    s403.Caption = Range("data!R383")
    s404.Caption = Range("data!S383")
    s405.Caption = Range("data!T383")
    s406.Caption = Range("data!U383")
    s407.Caption = Range("data!V383")
    s408.Caption = Range("data!W383")
    s409.Caption = Range("data!X383")
    s410.Caption = Range("data!Y383")
    
    s500.Caption = Range("data!O384")
    s501.Caption = Range("data!P384")
    s502.Caption = Range("data!Q384")
    s503.Caption = Range("data!R384")
    s504.Caption = Range("data!S384")
    s505.Caption = Range("data!T384")
    s506.Caption = Range("data!U384")
    s507.Caption = Range("data!V384")
    s508.Caption = Range("data!W384")
    s509.Caption = Range("data!X384")
    s510.Caption = Range("data!Y384")
    
    s600.Caption = Range("data!O385")
    s601.Caption = Range("data!P385")
    s602.Caption = Range("data!Q385")
    s603.Caption = Range("data!R385")
    s604.Caption = Range("data!S385")
    s605.Caption = Range("data!T385")
    s606.Caption = Range("data!U385")
    s607.Caption = Range("data!V385")
    s608.Caption = Range("data!W385")
    s609.Caption = Range("data!X385")
    s610.Caption = Range("data!Y385")
    
    kiroku_label.Caption = Range("data!T307")
    
    rating1.Font.Size = 10.5
    rating1_p.Font.Size = 10.5
    
    If Range("data!F301") = 1 Then
        transition_Label.Caption = "今季打率推移"
        rating1.Caption = Range("data!C308")
        rating4.Caption = Range("data!F308")
        rating5.Caption = Range("data!G308")
        Controls(Range("data!C309").Value & "1").left = 247
        Controls(Range("data!F309").Value & "4").left = 247
        Controls(Range("data!G309").Value & "5").left = 247
    Else
        transition_Label.Caption = "今季防御率推移"
        rating1.Caption = ""
        rating4.Caption = ""
        rating5.Caption = ""
        rating1_p.Caption = Range("data!C308")
    End If
    
    rating2.Caption = Range("data!D308")
    rating3.Caption = Range("data!E308")
    
    detail1.Caption = Range("data!M310")
    detail2.Caption = Range("data!N310")
    detail3.Caption = Range("data!O310")
    detail4.Caption = Range("data!P310")
    detail5.Caption = Range("data!Q310")
    detail6.Caption = Range("data!R310")
    detail7.Caption = Range("data!S310")
    
    Controls(Range("data!D309").Value & "2").left = 247
    Controls(Range("data!E309").Value & "3").left = 247
    
    Controls(Range("data!M335").Value & "12").left = 377
    Controls(Range("data!N335").Value & "13").left = 407
    Controls(Range("data!O335").Value & "14").left = 389
    Controls(Range("data!P335").Value & "15").left = 347
    Controls(Range("data!q335").Value & "16").left = 365
    Controls(Range("data!R335").Value & "17").left = 417
    Controls(Range("data!S335").Value & "18").left = 377
    Controls(Range("data!T335").Value & "19").left = 337
End If

End Sub
