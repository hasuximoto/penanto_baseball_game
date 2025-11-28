VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} player_option 
   Caption         =   "詳細"
   ClientHeight    =   1545
   ClientLeft      =   50
   ClientTop       =   380
   ClientWidth     =   3010
   OleObjectBlob   =   "player_option.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "player_option"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub command1_Click()

player_option_drft.Show

End Sub

Private Sub command2_Click()

If command2.BackStyle = 0 Then
    player_option_pos.Show
End If

End Sub

Private Sub UserForm_Initialize()

If Range("data!D301").Value = Range("チーム情報!B3").Value And Range("data!F301").Value = 1 Then
    command2.BackStyle = 0
End If

End Sub
