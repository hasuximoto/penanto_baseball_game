VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} fa_hosho_settei 
   Caption         =   "プロテクトリスト作成"
   ClientHeight    =   7560
   ClientLeft      =   50
   ClientTop       =   440
   ClientWidth     =   10350
   OleObjectBlob   =   "fa_hosho_settei.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "fa_hosho_settei"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False



Private Sub kettei_Click()

If Range("FA選手!DW42") = 28 Then
    Unload Me
Else
    MsgBox "28選手を選択してください。"
End If
End Sub

Private Sub miru_Click()

If ListBox1.Text = "" Then
    MsgBox "選手を選択してください"
Else
    Range("data!C301").Value = ListBox1.List(ListBox1.ListIndex, 1)
    Range("FA選手!DU42").Value = Range("data!C301").Value
    Range("FA選手!DV42").Calculate
    Range("data!L301") = Range("FA選手!DT" & Range("FA選手!DV42").Value).Value
    Call 選手データオープン
    Range("data!L301") = ""
End If
sentakuchu.Caption = "/ " & Range("FA選手!DW42") & "人選択中"

End Sub

Private Sub UserForm_QueryClose(Cancel As Integer, CloseMode As Integer)
    If CloseMode = 0 Then
        MsgBox "閉じられません", 48
        Cancel = True
    End If
End Sub

Private Sub UserForm_Initialize()

Label1.Caption = Range("FA選手!DR97").Value
Label2.Caption = Range("FA選手!DR98").Value

With ListBox1
    .ColumnCount = 5
    .ColumnWidths = "80;80;30,50,150"
    .RowSource = "FA選手!DT44:DX" & Range("FA選手!DX42")
    .ColumnHeads = True
End With

sentakuchu.Caption = "/ " & Range("FA選手!DW42") & "人選択中"

End Sub
