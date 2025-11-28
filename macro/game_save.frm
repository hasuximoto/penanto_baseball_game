VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} game_save 
   Caption         =   "データ保存"
   ClientHeight    =   1810
   ClientLeft      =   50
   ClientTop       =   380
   ClientWidth     =   4210
   OleObjectBlob   =   "game_save.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "game_save"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub back_Click()

Unload Me

End Sub

Private Sub hozon_suru_Click()

message.left = 6
game_save.Repaint
Call データセーブ
Unload Me

End Sub

Private Sub Label3_Click()

Unload Me

End Sub
