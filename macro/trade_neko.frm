VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} trade_neko 
   Caption         =   "トレード依頼"
   ClientHeight    =   3615
   ClientLeft      =   50
   ClientTop       =   440
   ClientWidth     =   6820
   OleObjectBlob   =   "trade_neko.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "trade_neko"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

Private Sub judaku_Click()

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

MsgBox "トレードを実行しました。"
Unload Me

End Sub

Private Sub kyohi_Click()

MsgBox "トレードを断りました。"
Unload Me

End Sub

Private Sub teamA_1_Click()

Range("data!C301").Value = Range("FA選手!DJ154").Value
If Not Range("data!C301").Value = "" Then
    Call 選手データオープン
End If

End Sub

Private Sub teamA_2_Click()

Range("data!C301").Value = Range("FA選手!DK154").Value
If Not Range("data!C301").Value = "" Then
    Call 選手データオープン
End If

End Sub

Private Sub teamB_1_Click()

Range("data!C301").Value = Range("FA選手!DL154").Value
If Not Range("data!C301").Value = "" Then
    Call 選手データオープン
End If

End Sub

Private Sub teamB_2_Click()

Range("data!C301").Value = Range("FA選手!DM154").Value
If Not Range("data!C301").Value = "" Then
    Call 選手データオープン
End If

End Sub

Private Sub UserForm_QueryClose(Cancel As Integer, CloseMode As Integer)
    If CloseMode = 0 Then
        MsgBox "閉じられません", 48
        Cancel = True
    End If
End Sub

Private Sub UserForm_Initialize()

teamA.Caption = Range("FA選手!DJ149").Value
teamA_1.Caption = Range("FA選手!DJ154").Value
teamA_2.Caption = Range("FA選手!DK154").Value
teamA_3.Caption = Range("FA選手!DO155").Value
teamB.Caption = Range("FA選手!DJ147").Value
teamB_1.Caption = Range("FA選手!DL154").Value
teamB_2.Caption = Range("FA選手!DM154").Value
teamB_3.Caption = Range("FA選手!DN155").Value

End Sub
