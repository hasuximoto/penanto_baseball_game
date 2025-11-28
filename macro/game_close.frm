VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} game_close 
   Caption         =   "ゲーム終了"
   ClientHeight    =   3480
   ClientLeft      =   50
   ClientTop       =   380
   ClientWidth     =   4210
   OleObjectBlob   =   "game_close.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "game_close"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub back_Click()

Unload Me

End Sub

Private Sub gamen_close_Click()

ActiveWindow.WindowState = xlMaximized

Sheets("top").Shapes("game_reopen").Top = Range("B2").Top
Sheets("top").Shapes("game_reopen").left = Range("B2").left
Unload Me

If Range("data!C61") = 1 Then
    On Error GoTo myError
    team_info.Hide
    main_menu.Hide
Else
    stove_league.Hide
End If

myError:
    main_menu.Hide
    team_info.Hide

End Sub

Private Sub hozon_sinai_Click()

If CloseMode = 0 Then
    Application.DisplayAlerts = False
    Workbooks("CellBall.xls").Close
    Application.DisplayAlerts = True
    Cancel = True
End If

End Sub

Private Sub hozon_suru_Click()

message.left = 6
game_close.Repaint
Call データセーブ
If CloseMode = 0 Then
    Application.DisplayAlerts = False
    Workbooks("CellBall.xls").Close
    Application.DisplayAlerts = True
    Cancel = True
End If

End Sub

Private Sub Label1_Click()

End Sub

Private Sub UserForm_Click()

End Sub
