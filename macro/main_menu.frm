VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} main_menu 
   Caption         =   "CellBall"
   ClientHeight    =   8580
   ClientLeft      =   13550
   ClientTop       =   380
   ClientWidth     =   13410
   OleObjectBlob   =   "main_menu.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "main_menu"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False


Private Sub flag_frame_Click()

End Sub

Private Sub gamestart_Click()

Call 試合実行ボタン

End Sub


Private Sub go_to_stove_Click()

go_to_stove.BackStyle = 1
go_to_stove.Caption = "データを保存しています... しばらくお待ちください"
main_menu.Repaint
Call データセーブ
go_to_stove.Caption = "オフシーズン開始の準備をしています... しばらくお待ちください"
main_menu.Repaint
Call オフシーズン開始
Unload Me
yosan.Show
stove_league.Show

End Sub

Private Sub Image14_Click()

End Sub





Private Sub Label_game_Click()

If Label_game.Caption = "結果を見る" Then
    Range("data!E203").Value = Range("data!C2").Value - 41000
    Range("data!D203").Value = 1
    siai_kekka.Show
End If

End Sub

Private Sub Label1_Click()

Unload Me

End Sub

Private Sub Label2_Click()

End Sub

Private Sub news_message1_Click()

If Range("data!C6") = 2 And Not Range("data!Q42") = "" Then
    Range("data!E203").Value = Range("data!C2").Value - 41000
    Range("data!D203").Value = Range("data!Q42")
    siai_kekka.Show
End If

End Sub

Private Sub news_message2_Click()

If Range("data!C6") = 2 And Not Range("data!R42") = "" Then
    Range("data!E203").Value = Range("data!C2").Value - 41000
    Range("data!D203").Value = Range("data!R42")
    siai_kekka.Show
End If

End Sub

Private Sub news_message3_Click()

If Range("data!C6") = 2 And Not Range("data!S42") = "" Then
    Range("data!E203").Value = Range("data!C2").Value - 41000
    Range("data!D203").Value = Range("data!S42")
    siai_kekka.Show
End If

End Sub

Private Sub news_message4_Click()

If Range("data!C6") = 2 And Not Range("data!T42") = "" Then
    Range("data!E203").Value = Range("data!C2").Value - 41000
    Range("data!D203").Value = Range("data!T42")
    siai_kekka.Show
End If

End Sub

Private Sub news_message5_Click()

If Range("data!C6") = 2 And Not Range("data!U42") = "" Then
    Range("data!E203").Value = Range("data!C2").Value - 41000
    Range("data!D203").Value = Range("data!U42")
    siai_kekka.Show
End If

End Sub

Private Sub news_message6_Click()

If Range("data!C6") = 2 And Not Range("data!V42") = "" Then
    Range("data!E203").Value = Range("data!C2").Value - 41000
    Range("data!D203").Value = Range("data!V42")
    siai_kekka.Show
End If

End Sub



Private Sub save_Click()

game_save.Show

End Sub

Private Sub skip_Click()

game_skip.Show

End Sub

Private Sub UserForm_QueryClose(Cancel As Integer, CloseMode As Integer)

If CloseMode = 0 Then
    Cancel = True
    game_close.Show
End If

End Sub

Private Sub le_player1_Click()

Range("data!C301").Value = Range("data!C48").Value
Call 選手データオープン

End Sub

Private Sub le_player2_Click()

Range("data!C301").Value = Range("data!C49").Value
Call 選手データオープン

End Sub

Private Sub le_player3_Click()

Range("data!C301").Value = Range("data!C50").Value
Call 選手データオープン

End Sub

Private Sub le_player4_Click()

Range("data!C301").Value = Range("data!C51").Value
Call 選手データオープン

End Sub

Private Sub le_player5_Click()

Range("data!C301").Value = Range("data!C52").Value
Call 選手データオープン

End Sub

Private Sub le_player6_Click()

Range("data!C301").Value = Range("data!C53").Value
Call 選手データオープン

End Sub

Private Sub nitteinext_Click()

Call 日程進行ボタン

End Sub



Private Sub le_button1_Click()

Range("data!D47").Value = "1"
Call リーダーズ表示

End Sub


Private Sub le_button2_Click()

Range("data!D47").Value = "2"
Call リーダーズ表示

End Sub


Private Sub le_button3_Click()

Range("data!D47").Value = "3"
Call リーダーズ表示

End Sub

Private Sub le_button4_Click()

Range("data!D47").Value = "4"
Call リーダーズ表示
End Sub

Private Sub le_switch_r_Click()

If Range("data!C47").Value = "1" Then
Range("data!C47").Value = "3"
Else
Range("data!C47").Value = Range("data!C47").Value - 1
End If
Range("data!D47").Value = "1"
Call リーダーズ表示

End Sub

Private Sub le_switch_l_Click()

If Range("data!C47").Value = "3" Then
Range("data!C47").Value = "1"
Else
Range("data!C47").Value = Range("data!C47").Value + 1
End If
Range("data!D47").Value = "1"
Call リーダーズ表示

End Sub



Private Sub pu_age_Click()

End Sub

Private Sub pu_name_Click()

Range("data!C301").Value = Range("data!C54").Value
Call 選手データオープン

End Sub

Private Sub score2_Click()

End Sub

Private Sub st_team1_Click()

Range("data!C101") = Range("data!M20")
Range("data!C101:K101").Calculate

With team_info
    .team.Caption = Range("data!E101").Value
    .hawks1.left = 700
    .hawks2.left = 700
    .lions1.left = 700
    .lions2.left = 700
    .fighters1.left = 700
    .fighters2.left = 700
    .buffaloes1.left = 700
    .buffaloes2.left = 700
    .eagles1.left = 700
    .eagles2.left = 700
    .marines1.left = 700
    .marines2.left = 700
    .Controls(Range("data!F101").Value & 1).left = 17
    .Controls(Range("data!F101").Value & 2).left = 17
End With

Call 球団情報_オーダー表示

main_menu.Hide
team_info.Show

End Sub


Private Sub st_team2_Click()

Range("data!C101") = Range("data!M21")
Range("data!C101:K101").Calculate

With team_info
    .team.Caption = Range("data!E101").Value
    .hawks1.left = 700
    .hawks2.left = 700
    .lions1.left = 700
    .lions2.left = 700
    .fighters1.left = 700
    .fighters2.left = 700
    .buffaloes1.left = 700
    .buffaloes2.left = 700
    .eagles1.left = 700
    .eagles2.left = 700
    .marines1.left = 700
    .marines2.left = 700
    .Controls(Range("data!F101").Value & 1).left = 17
    .Controls(Range("data!F101").Value & 2).left = 17
End With

Call 球団情報_オーダー表示

main_menu.Hide
team_info.Show

End Sub


Private Sub st_team3_Click()

Range("data!C101") = Range("data!M22")
Range("data!C101:K101").Calculate

With team_info
    .team.Caption = Range("data!E101").Value
    .hawks1.left = 700
    .hawks2.left = 700
    .lions1.left = 700
    .lions2.left = 700
    .fighters1.left = 700
    .fighters2.left = 700
    .buffaloes1.left = 700
    .buffaloes2.left = 700
    .eagles1.left = 700
    .eagles2.left = 700
    .marines1.left = 700
    .marines2.left = 700
    .Controls(Range("data!F101").Value & 1).left = 17
    .Controls(Range("data!F101").Value & 2).left = 17
End With

Call 球団情報_オーダー表示

main_menu.Hide
team_info.Show

End Sub


Private Sub st_team4_Click()

Range("data!C101") = Range("data!M23")
Range("data!C101:K101").Calculate

With team_info
    .team.Caption = Range("data!E101").Value
    .hawks1.left = 700
    .hawks2.left = 700
    .lions1.left = 700
    .lions2.left = 700
    .fighters1.left = 700
    .fighters2.left = 700
    .buffaloes1.left = 700
    .buffaloes2.left = 700
    .eagles1.left = 700
    .eagles2.left = 700
    .marines1.left = 700
    .marines2.left = 700
    .Controls(Range("data!F101").Value & 1).left = 17
    .Controls(Range("data!F101").Value & 2).left = 17
End With

Call 球団情報_オーダー表示

main_menu.Hide
team_info.Show

End Sub


Private Sub st_team5_Click()

Range("data!C101") = Range("data!M24")
Range("data!C101:K101").Calculate

With team_info
    .team.Caption = Range("data!E101").Value
    .hawks1.left = 700
    .hawks2.left = 700
    .lions1.left = 700
    .lions2.left = 700
    .fighters1.left = 700
    .fighters2.left = 700
    .buffaloes1.left = 700
    .buffaloes2.left = 700
    .eagles1.left = 700
    .eagles2.left = 700
    .marines1.left = 700
    .marines2.left = 700
    .Controls(Range("data!F101").Value & 1).left = 17
    .Controls(Range("data!F101").Value & 2).left = 17
End With

Call 球団情報_オーダー表示

main_menu.Hide
team_info.Show

End Sub



Private Sub st_team6_Click()

Range("data!C101") = Range("data!M25")
Range("data!C101:K101").Calculate

With team_info
    .team.Caption = Range("data!E101").Value
    .hawks1.left = 700
    .hawks2.left = 700
    .lions1.left = 700
    .lions2.left = 700
    .fighters1.left = 700
    .fighters2.left = 700
    .buffaloes1.left = 700
    .buffaloes2.left = 700
    .eagles1.left = 700
    .eagles2.left = 700
    .marines1.left = 700
    .marines2.left = 700
    .Controls(Range("data!F101").Value & 1).left = 17
    .Controls(Range("data!F101").Value & 2).left = 17
End With

Call 球団情報_オーダー表示

main_menu.Hide
team_info.Show

End Sub


Private Sub UserForm_Initialize()

'午後かつ試合あるかつ試合前なら試合ボタンだす
If Range("data!C６") = 1 And Range("data!C5") = "午後" And Not (Range("data!C36") = "" And Range("data!C37") = "" And Range("data!C38") = "") Then
    nitteinext.left = 700
    gamestart.left = 168
End If
        
If Range("data!C6") = 2 Then
    Call メイン画面セット_試合後
Else
    Call メイン画面セット_日程進行
End If
Controls("flag_" & Range("チーム情報!B11").Value).left = 28

date_back = Range("data!C1").Value
date_top = Range("data!C1").Value

hawks1.left = Range("data!F38").Value
hawks2.left = Range("data!F38").Value
lions1.left = Range("data!G38").Value
lions2.left = Range("data!G38").Value
fighters1.left = Range("data!H38").Value
fighters2.left = Range("data!H38").Value
buffaloes1.left = Range("data!I38").Value
buffaloes2.left = Range("data!I38").Value
eagles1.left = Range("data!J38").Value
eagles2.left = Range("data!J38").Value
marines1.left = Range("data!K38").Value
marines2.left = Range("data!K38").Value

'順位
st_rank1.Caption = Range("data!B14").Value
st_rank2.Caption = Range("data!B15").Value
st_rank3.Caption = Range("data!B16").Value
st_rank4.Caption = Range("data!B17").Value
st_rank5.Caption = Range("data!B18").Value
st_rank6.Caption = Range("data!B19").Value
st_team1.Caption = Range("data!C14").Value
st_team2.Caption = Range("data!C15").Value
st_team3.Caption = Range("data!C16").Value
st_team4.Caption = Range("data!C17").Value
st_team5.Caption = Range("data!C18").Value
st_team6.Caption = Range("data!C19").Value
st_behind1.Caption = Range("data!D14").Value
st_behind2.Caption = Range("data!D15").Value
st_behind3.Caption = Range("data!D16").Value
st_behind4.Caption = Range("data!D17").Value
st_behind5.Caption = Range("data!D18").Value
st_behind6.Caption = Range("data!D19").Value
st_pct1.Caption = Range("data!E14").Value
st_pct2.Caption = Range("data!E15").Value
st_pct3.Caption = Range("data!E16").Value
st_pct4.Caption = Range("data!E17").Value
st_pct5.Caption = Range("data!E18").Value
st_pct6.Caption = Range("data!E19").Value

'リーダーズ
Call リーダーズ表示

End Sub
