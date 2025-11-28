VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} fa_hosho 
   Caption         =   "FA移籍に伴う補償"
   ClientHeight    =   6510
   ClientLeft      =   50
   ClientTop       =   440
   ClientWidth     =   7450
   OleObjectBlob   =   "fa_hosho.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "fa_hosho"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub Frame1_Click()

End Sub

Private Sub Label3_Click()

End Sub

Private Sub Label4_Click()

End Sub

Private Sub kettei_Click()

If OptionButton1.Value = True Then
    If ListBox1.Text = "" Then
        MsgBox "選手を選択してください"
    Else
        Range("FA選手!DR96").Value = "False"
        Range("FA選手!DS96").Value = ListBox1.List(ListBox1.ListIndex, 0)
        Unload Me
    End If
ElseIf OptionButton2.Value = True Then
    Range("FA選手!DR96").Value = "True"
    MsgBox "金銭を受け取りました。"
    Unload Me
Else
    MsgBox "選択されていません"
End If

End Sub

Private Sub miru_Click()

If ListBox1.Text = "" Then
    MsgBox "選手を選択してください"
Else
    Range("data!C301").Value = ListBox1.List(ListBox1.ListIndex, 0)
    Range("data!C1103").Value = Range("data!C301").Value
    Call 選手データオープン
End If

End Sub

Private Sub OptionButton2_Change()

If OptionButton2.Value = True Then
    ListBox1.left = 1000
    miru.left = 1000
End If

End Sub

Private Sub OptionButton1_Change()

If OptionButton1.Value = True Then
    ListBox1.left = 6
    miru.left = 6
End If

End Sub
Private Sub UserForm_QueryClose(Cancel As Integer, CloseMode As Integer)
    If CloseMode = 0 Then
        MsgBox "閉じられません", 48
        Cancel = True
    End If
End Sub

Private Sub UserForm_Initialize()

Label1.Caption = Range("FA選手!DS97").Value
Label2.Caption = Range("FA選手!DS98").Value

With ListBox1
    .ColumnCount = 4
    .ColumnWidths = "80;30,50,150"
    .RowSource = "FA選手!DP44:DS" & Range("FA選手!DO43")
    .ColumnHeads = True
    .MultiSelect = fmMultiSelectSingle
    .ListStyle = fmListStyleOption
End With


End Sub
