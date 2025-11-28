VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} UserForm28 
   Caption         =   "指名確認"
   ClientHeight    =   1330
   ClientLeft      =   50
   ClientTop       =   440
   ClientWidth     =   4210
   OleObjectBlob   =   "UserForm28.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "UserForm28"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False


Private Sub UserForm_QueryClose(Cancel As Integer, CloseMode As Integer)

Range("ドラフト会議!FA29") = ""

End Sub

Private Sub CommandButton1_Click()

If Range("ドラフト会議!FA29") = "指名終了" Then

    Range(Range("ドラフト会議!ET18").Value).Value = "選択終了"
    Unload Me
    Range("ドラフト会議!FA29") = "指名終了"
    UserForm27.Show
    
Else

    If Range("ドラフト会議!FA7") = 1 Then 'ドラ１のときの処理
        Range("ドラフト会議!FA14") = Range("ドラフト会議!FQ1")
        Sheets("ドラフト会議").Calculate
        Range("ドラフト会議!FA8:FA13").Value = Range("ドラフト会議!EY8:EY13").Value
        Sheets("ドラフト会議").Calculate
    Else
        Range(Range("ドラフト会議!ET18").Value).Value = Range("ドラフト会議!FQ1").Value
        Range("ドラフト会議!D18") = "" '条件付き書式更新
    End If
    
    Unload Me
    UserForm27.Show

End If

If Range("ドラフト会議!FA30") = "" Then
Range("ドラフト会議!FA30") = Range("ドラフト会議!FQ1")
End If

End Sub

Private Sub CommandButton2_Click()

Range("ドラフト会議!FA29") = ""
Unload Me

End Sub

Private Sub UserForm_Initialize()

If Range("ドラフト会議!FA29") = "" Then
Label1.Caption = Range("ドラフト会議!FQ1") & " 選手を指名します。"
Else
Label1.Caption = "本当に指名を終了してもいいですか？"
End If

End Sub

Private Sub UserForm_Click()

End Sub

