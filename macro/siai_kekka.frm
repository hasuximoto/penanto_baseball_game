VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} siai_kekka 
   Caption         =   "試合結果"
   ClientHeight    =   5190
   ClientLeft      =   50
   ClientTop       =   380
   ClientWidth     =   9990
   OleObjectBlob   =   "siai_kekka.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "siai_kekka"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False


Private Sub Image2_Click()

Range("data!G203").Value = 3 - Range("data!G203").Value
If Range("data!G203").Value = 1 Then
    Range("data!H203").Value = 3 - Range("data!H203").Value
End If

Range("data!C202:AD226").Calculate
statstype.Caption = Range("data!J203").Value

With ListBox1
    .ColumnCount = 9
    .RowSource = "data!C211:K" & Range("data!I203")
    .ColumnHeads = True
    .MultiSelect = fmMultiSelectSingle
    If Range("data!G203") = 1 Then
        .ColumnWidths = "25;25;80;25;25;25;25;25;25"
    Else
        .ColumnWidths = "25;80;25;25;25;25;25;25;25"
    End If
End With

End Sub

Private Sub Image3_Click()

Range("data!G203").Value = 3 - Range("data!G203").Value
If Range("data!G203").Value = 2 Then
    Range("data!H203").Value = 3 - Range("data!H203").Value
End If

Range("data!C202:AD226").Calculate
statstype.Caption = Range("data!J203").Value

With ListBox1
    .ColumnCount = 9
    .RowSource = "data!C211:K" & Range("data!I203")
    .ColumnHeads = True
    .MultiSelect = fmMultiSelectSingle
    If Range("data!G203") = 1 Then
        .ColumnWidths = "25;25;80;25;25;25;25;25;25"
    Else
        .ColumnWidths = "25;80;25;25;25;25;25;25;25"
    End If
End With

End Sub



Private Sub toziru_Click()

Unload Me

End Sub

Private Sub UserForm_Initialize()

Range("data!G203").Value = 1
Range("data!H203").Value = 1
Range("data!C202:AD226").Calculate

Dim i As Byte

statstype.Caption = Range("data!J203").Value

With ListBox1
    .ColumnCount = 9
    .RowSource = "data!C211:K" & Range("data!I203")
    .ColumnHeads = True
    .MultiSelect = fmMultiSelectSingle
    If Range("data!G203") = 1 Then
        .ColumnWidths = "25;25;80;25;25;25;25;25;25"
    Else
        .ColumnWidths = "25;80;25;25;25;25;25;25;25"
    End If
End With

game_name.Caption = Range("data!F203").Value
shouri.Caption = Range("data!D207").Value
haisen.Caption = Range("data!D208").Value
save.Caption = Range("data!D209").Value

For i = 1 To 14
    Controls("Label" & i) = Sheets("data").Cells(205, i + 2)
Next
For i = 15 To 28
    Controls("Label" & i) = Sheets("data").Cells(206, i + 2 - 14)
Next

End Sub


