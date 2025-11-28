VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} stove_league 
   Caption         =   "ストーブリーグ"
   ClientHeight    =   8325
   ClientLeft      =   50
   ClientTop       =   380
   ClientWidth     =   13360
   OleObjectBlob   =   "stove_league.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "stove_league"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False


Private Sub go_to_camp_Click()

Sheets("選手リスト").Calculate '所属先把握できないとサブポジ取得などにかかわるので
Sheets("FA選手").Calculate 'コンバートに使う
Range("選手データ!AJ3:AJ1000").Calculate
Sheets("キャンプ計算").Calculate

Range("キャンプ計算!B3:S1000").Value = Range("選手データ!B3:S1000").Value
Range("キャンプ計算!T3:T1000").Value = Range("選手データ!U3:U1000").Value
Range("キャンプ計算!U3:U1000").Value = Range("選手データ!Z3:Z1000").Value
Range("キャンプ計算!V3:AF1000").Value = Range("選手データ!EK3:EU1000").Value

Range("キャンプ計算!AY101:AY145").Value = Range("キャンプ計算!BD101:BD145").Value

Unload Me
camp.Show

End Sub

Private Sub go_to_draft_Click()

Unload Me
draft_kaigi.Show

End Sub

Private Sub go_to_senryokugai_Click()

Unload Me
Call 解雇開始

End Sub

Private Sub Image1_Click()

End Sub

Private Sub Image3_Click()

Range("data!IR24") = 1
Range("data!IR3:IR7").Value = False
Range("data!IR2").Value = True

With player_list
    .CheckBox1.Value = True
    .CheckBox2.Value = False
    .CheckBox3.Value = False
    .CheckBox4.Value = False
    .CheckBox5.Value = False
    .CheckBox6.Value = False
End With
Range("data!IR24") = ""
player_list.Show

End Sub

Private Sub koushou_Click()

If ListBox1.Text = "" Then
    MsgBox "選手を選択してください"
Else
    Range("data!C301").Value = ListBox1.List(ListBox1.ListIndex, 0)
    Range("data!C1103").Value = Range("data!C301").Value
    Range("data!A1102:I1105").Calculate
    Range("data!E1103:F1103").Value = Range("data!E1105:F1105").Value
    Range("data!L301") = "契約提示"
    Call 選手データオープン
    Range("data!L301") = ""
End If

yosan2.Caption = Range("data!R1087").Value


Call ストーブリーグリペイント

End Sub

Private Sub Label44_Click()

Unload Me

End Sub

Private Sub Label46_Click()

Sheets("data").Calculate
Call ストーブリーグリペイント

End Sub

Private Sub Label52_Click()

End Sub

Private Sub Label9_Click()

End Sub

Private Sub sinkou_Click()

Call ストーブリーグ_ターン進行
Call ストーブリーグリペイント

End Sub

Private Sub trade_koushou_Click()

'comトレード後の選手リスト更新
Range("FA選手!EA1:EM100").Calculate
Range("FA選手!DR178:DR180").Value = ""
Range("FA選手!DR182:DR184").Value = ""
Range("FA選手!DM163:EC282").Calculate

trade_tachi.Show

End Sub

Private Sub UserForm_QueryClose(Cancel As Integer, CloseMode As Integer)

game_close.off_season.left = 6

If CloseMode = 0 Then
    Cancel = True
    game_close.Show
End If

End Sub

Private Sub UserForm_Initialize()


With ListBox1
    .ColumnCount = 6
    .ColumnWidths = "80;30;30,80,150,80"
    .RowSource = "data!E1273:J" & Range("data!D1272")
    .ColumnHeads = True
End With
turn.Caption = Range("data!C1106")
yosan1.Caption = Range("data!L1114")
yosan2.Caption = Range("data!M1114")
yosan3.Caption = Range("data!N1114")
yosan4.Caption = Range("data!O1114")
ninzu1.Caption = Range("FA選手!DY4")
ninzu2.Caption = Range("FA選手!DY5")
ninzu3.Caption = Range("FA選手!DY6")
ninzu4.Caption = Range("FA選手!DY7")
ninzu5.Caption = Range("FA選手!DY8")
ninzu6.Caption = Range("FA選手!DY9")
ninzu7.Caption = Range("FA選手!DY10")
ninzu8.Caption = Range("FA選手!DY11")
ninzu9.Caption = Range("FA選手!DY12")
hyoka1.Caption = Range("FA選手!DX14")
hyoka2.Caption = Range("FA選手!DX15")

End Sub
