VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} team_info 
   Caption         =   "CellBall"
   ClientHeight    =   8580
   ClientLeft      =   50
   ClientTop       =   380
   ClientWidth     =   13410
   OleObjectBlob   =   "team_info.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "team_info"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

Private Sub button_order_Click()

Label_contents.Caption = "最新一軍オーダー"
Call 球団情報_オーダー表示

End Sub




Private Sub homebutton_Click()

team_info.Hide
main_menu.Show

End Sub



Private Sub Label1_Click()



End Sub

Private Sub kako_season_Click()

Range("data!J101:Y201").Calculate
team_kako.Show

End Sub

Private Sub senshu_list_Click()

Range("data!IR24") = 1
Range("data!IR2:IR7").Value = False
Range("data!IR" & Range("data!C101").Value + 1).Value = True
With player_list
    .CheckBox1.Value = False
    .CheckBox2.Value = False
    .CheckBox3.Value = False
    .CheckBox4.Value = False
    .CheckBox5.Value = False
    .CheckBox6.Value = False
    .Controls("CheckBox" & Range("data!C101").Value) = True
End With
Range("data!IR24") = ""
player_list.Show

End Sub

Private Sub UserForm_QueryClose(Cancel As Integer, CloseMode As Integer)
    If CloseMode = 0 Then
        Cancel = True
        game_close.Show
    End If
End Sub

Private Sub pl1_Click()

Range("data!C301").Value = Range("data!J102").Value
Call 選手データオープン

End Sub


Private Sub pl2_Click()

Range("data!C301").Value = Range("data!J103").Value
Call 選手データオープン

End Sub


Private Sub pl3_Click()

Range("data!C301").Value = Range("data!J104").Value
Call 選手データオープン

End Sub


Private Sub pl4_Click()

Range("data!C301").Value = Range("data!J105").Value
Call 選手データオープン

End Sub

Private Sub pl5_Click()

Range("data!C301").Value = Range("data!J106").Value
Call 選手データオープン

End Sub

Private Sub pl6_Click()

Range("data!C301").Value = Range("data!J107").Value
Call 選手データオープン

End Sub

Private Sub pl7_Click()

Range("data!C301").Value = Range("data!J108").Value
Call 選手データオープン

End Sub

Private Sub pl8_Click()

Range("data!C301").Value = Range("data!J109").Value
Call 選手データオープン

End Sub

Private Sub pl9_Click()

Range("data!C301").Value = Range("data!J110").Value
Call 選手データオープン

End Sub


Private Sub pl10_Click()

Range("data!C301").Value = Range("data!J111").Value
Call 選手データオープン

End Sub

Private Sub pl11_Click()

Range("data!C301").Value = Range("data!J112").Value
Call 選手データオープン

End Sub

Private Sub pl12_Click()

Range("data!C301").Value = Range("data!J113").Value
Call 選手データオープン

End Sub

Private Sub pl13_Click()

Range("data!C301").Value = Range("data!J114").Value
Call 選手データオープン

End Sub


Private Sub pl14_Click()

Range("data!C301").Value = Range("data!J115").Value
Call 選手データオープン

End Sub

Private Sub pl15_Click()

Range("data!C301").Value = Range("data!J116").Value
Call 選手データオープン

End Sub

Private Sub pl16_Click()

Range("data!C301").Value = Range("data!J117").Value
Call 選手データオープン

End Sub


Private Sub pl1p_Click()

Range("data!C301").Value = Range("data!J118").Value
Call 選手データオープン

End Sub

Private Sub pl2p_Click()

Range("data!C301").Value = Range("data!J119").Value
Call 選手データオープン

End Sub

Private Sub pl3p_Click()

Range("data!C301").Value = Range("data!J120").Value
Call 選手データオープン

End Sub

Private Sub pl4p_Click()

Range("data!C301").Value = Range("data!J121").Value
Call 選手データオープン

End Sub

Private Sub pl5p_Click()

Range("data!C301").Value = Range("data!J122").Value
Call 選手データオープン

End Sub

Private Sub pl6p_Click()

Range("data!C301").Value = Range("data!J123").Value
Call 選手データオープン

End Sub

Private Sub pl7p_Click()

Range("data!C301").Value = Range("data!J124").Value
Call 選手データオープン

End Sub

Private Sub pl8p_Click()

Range("data!C301").Value = Range("data!J125").Value
Call 選手データオープン

End Sub

Private Sub pl9p_Click()

Range("data!C301").Value = Range("data!J126").Value
Call 選手データオープン

End Sub

Private Sub pl10p_Click()

Range("data!C301").Value = Range("data!J127").Value
Call 選手データオープン

End Sub

Private Sub pl11p_Click()

Range("data!C301").Value = Range("data!J128").Value
Call 選手データオープン

End Sub

Private Sub pl12p_Click()

Range("data!C301").Value = Range("data!J129").Value
Call 選手データオープン

End Sub


Private Sub teamswitch_l_Click()

If Range("data!C101") = 1 Then
    Range("data!C101") = 6
Else
    Range("data!C101") = Range("data!C101") - 1
End If

Range("data!C101:K101").Calculate
team.Caption = Range("data!E101").Value

hawks1.left = 700
hawks2.left = 700
lions1.left = 700
lions2.left = 700
fighters1.left = 700
fighters2.left = 700
buffaloes1.left = 700
buffaloes2.left = 700
eagles1.left = 700
eagles2.left = 700
marines1.left = 700
marines2.left = 700

Controls(Range("data!F101").Value & 1).left = 17
Controls(Range("data!F101").Value & 2).left = 17

Call 球団情報_オーダー表示

End Sub

Private Sub teamswitch_r_Click()

If Range("data!C101") = 6 Then
    Range("data!C101") = 1
Else
    Range("data!C101") = Range("data!C101") + 1
End If

Range("data!C101:K101").Calculate
team.Caption = Range("data!E101").Value

hawks1.left = 700
hawks2.left = 700
lions1.left = 700
lions2.left = 700
fighters1.left = 700
fighters2.left = 700
buffaloes1.left = 700
buffaloes2.left = 700
eagles1.left = 700
eagles2.left = 700
marines1.left = 700
marines2.left = 700

Controls(Range("data!F101").Value & 1).left = 17
Controls(Range("data!F101").Value & 2).left = 17

Call 球団情報_オーダー表示

End Sub

Private Sub UserForm_Initialize()

Controls("flag_" & Range("チーム情報!B11").Value).left = 28

date_back = Range("data!C1").Value
date_top = Range("data!C1").Value

team.Caption = Range("data!E101").Value
Controls(Range("data!F101").Value & 1).left = 17
Controls(Range("data!F101").Value & 2).left = 17

Range("data!C101:K101").Calculate


End Sub

